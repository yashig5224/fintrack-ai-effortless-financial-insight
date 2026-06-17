// Razorpay webhook — server-to-server payment events.
// Validates X-Razorpay-Signature with RAZORPAY_WEBHOOK_SECRET,
// dedupes by razorpay_payment_id, writes payments + subscriptions + profile.
// Public endpoint (no JWT) — Razorpay calls it directly.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-razorpay-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TIER_LIMITS: Record<string, { ai_usage_limit: number; voice_enabled: boolean; premium_enabled: boolean }> = {
  free:    { ai_usage_limit: 10,    voice_enabled: false, premium_enabled: false },
  starter: { ai_usage_limit: 100,   voice_enabled: false, premium_enabled: false },
  pro:     { ai_usage_limit: 9999,  voice_enabled: false, premium_enabled: true  },
  elite:   { ai_usage_limit: 99999, voice_enabled: true,  premium_enabled: true  },
};

const PLAN_KEY_TO_TIER: Record<string, { tier: string; cycle: "monthly" | "yearly"; name: string }> = {
  starter_monthly:  { tier: "starter", cycle: "monthly", name: "Starter" },
  pro_monthly:      { tier: "pro",     cycle: "monthly", name: "Pro AI" },
  pro_yearly:       { tier: "pro",     cycle: "yearly",  name: "Pro AI" },
  elite_monthly:    { tier: "elite",   cycle: "monthly", name: "Elite AI+" },
  elite_yearly:     { tier: "elite",   cycle: "yearly",  name: "Elite AI+" },
  ultimate_monthly: { tier: "elite",   cycle: "monthly", name: "Ultimate AI" },
};

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET missing");
      return new Response(JSON.stringify({ error: "webhook not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signature = req.headers.get("x-razorpay-signature") ?? "";
    const raw = await req.text();
    const expected = await hmacSha256Hex(secret, raw);
    if (!timingSafeEqual(signature, expected)) {
      console.warn("invalid webhook signature");
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(raw);
    const eventType: string = event?.event ?? "";
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── payment.captured ─────────────────────────────────────────────────
    if (eventType === "payment.captured") {
      const payment = event?.payload?.payment?.entity;
      if (!payment) return new Response(JSON.stringify({ ok: true, skipped: "no payment entity" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

      const paymentId: string = payment.id;
      const orderId: string = payment.order_id;
      const amount: number = payment.amount;
      const notes = payment.notes ?? {};
      const userId: string | undefined = notes.userId;
      const planKey: string | undefined = notes.planKey;

      if (!userId || !planKey) {
        console.warn("payment.captured missing notes", { paymentId, notes });
        return new Response(JSON.stringify({ ok: true, skipped: "missing notes" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Idempotency
      const { data: existing } = await admin.from("payments")
        .select("id").eq("razorpay_payment_id", paymentId).maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ ok: true, deduped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const plan = PLAN_KEY_TO_TIER[planKey];
      if (!plan) {
        console.warn("unknown planKey", planKey);
        return new Response(JSON.stringify({ ok: true, skipped: "unknown plan" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const now = new Date();
      const renewal = new Date(now);
      if (plan.cycle === "yearly") renewal.setFullYear(renewal.getFullYear() + 1);
      else renewal.setMonth(renewal.getMonth() + 1);

      await admin.from("payments").insert({
        user_id: userId,
        amount: amount / 100,
        currency: (payment.currency ?? "INR").toLowerCase(),
        payment_status: "succeeded",
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        plan_name: plan.name,
        environment: "live",
      });

      await admin.from("subscriptions").update({ status: "canceled" })
        .eq("user_id", userId).eq("status", "active");

      await admin.from("subscriptions").insert({
        user_id: userId,
        plan_name: plan.name,
        billing_cycle: plan.cycle,
        payment_id: paymentId,
        order_id: orderId,
        amount: amount / 100,
        status: "active",
        start_date: now.toISOString(),
        renewal_date: renewal.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: renewal.toISOString(),
        price_id: planKey,
        environment: "live",
      });

      const limits = TIER_LIMITS[plan.tier] ?? TIER_LIMITS.free;
      await admin.from("profiles").update({
        current_plan: plan.tier,
        ai_usage_limit: limits.ai_usage_limit,
        voice_enabled: limits.voice_enabled,
        premium_enabled: limits.premium_enabled,
      }).eq("id", userId);

      // Fire-and-forget email + push
      const { data: profile } = await admin.from("profiles")
        .select("email, full_name").eq("id", userId).maybeSingle();
      if (profile?.email) {
        admin.functions.invoke("send-email", {
          body: {
            to: profile.email,
            templateName: "payment-success",
            data: { amount: amount / 100, plan: plan.name, paymentId },
          },
        }).catch((e) => console.error("send-email", e));
      }
      admin.functions.invoke("send-push", {
        body: {
          userId,
          title: `Welcome to ${plan.name}`,
          body: `Your upgrade is live. Premium features unlocked.`,
          type: "subscription",
          link: "/app",
        },
      }).catch((e) => console.error("send-push", e));

      return new Response(JSON.stringify({ ok: true, processed: "payment.captured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── payment.failed ───────────────────────────────────────────────────
    if (eventType === "payment.failed") {
      const payment = event?.payload?.payment?.entity;
      if (payment?.id) {
        const { data: existing } = await admin.from("payments")
          .select("id").eq("razorpay_payment_id", payment.id).maybeSingle();
        if (!existing) {
          await admin.from("payments").insert({
            user_id: payment.notes?.userId ?? null,
            amount: (payment.amount ?? 0) / 100,
            currency: (payment.currency ?? "INR").toLowerCase(),
            payment_status: "failed",
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id,
            plan_name: PLAN_KEY_TO_TIER[payment.notes?.planKey ?? ""]?.name ?? null,
            environment: "live",
          });
        }
      }
      return new Response(JSON.stringify({ ok: true, processed: "payment.failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── subscription.cancelled ───────────────────────────────────────────
    if (eventType === "subscription.cancelled" || eventType === "subscription.completed") {
      const sub = event?.payload?.subscription?.entity;
      const userId = sub?.notes?.userId;
      if (userId) {
        await admin.from("subscriptions").update({ status: "canceled", cancel_at_period_end: true })
          .eq("user_id", userId).eq("status", "active");
        await admin.from("profiles").update({
          current_plan: "free",
          ai_usage_limit: 10,
          voice_enabled: false,
          premium_enabled: false,
        }).eq("id", userId);
      }
      return new Response(JSON.stringify({ ok: true, processed: eventType }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Unhandled event — still 200 so Razorpay doesn't retry forever
    return new Response(JSON.stringify({ ok: true, ignored: eventType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("payments-webhook fatal", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
