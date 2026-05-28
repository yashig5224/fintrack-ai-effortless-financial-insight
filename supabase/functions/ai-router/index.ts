// Multi-AI routing engine — secure server-side AI orchestration.
// Routes to GPT / Gemini / Claude-class models via Lovable AI Gateway,
// enforces plan-based access, smart-routes by intent, falls back on failure,
// and logs every request to ai_usage_logs.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Provider = "lumo" | "gpt" | "gemini" | "claude";
type PlanTier = "free" | "pro" | "elite";

interface ProviderSpec {
  id: Provider;
  label: string;
  model: string;          // Lovable AI Gateway model id
  minTier: PlanTier;
  strength: "balanced" | "reasoning" | "speed" | "analysis";
}

// Provider → model mapping (all routed via Lovable AI Gateway).
const PROVIDERS: Record<Provider, ProviderSpec> = {
  lumo:   { id: "lumo",   label: "Lumo Core",     model: "google/gemini-3-flash-preview", minTier: "free",  strength: "balanced"  },
  gpt:    { id: "gpt",    label: "GPT-class",     model: "openai/gpt-5-mini",             minTier: "pro",   strength: "reasoning" },
  gemini: { id: "gemini", label: "Gemini Pro",    model: "google/gemini-2.5-pro",         minTier: "pro",   strength: "speed"     },
  claude: { id: "claude", label: "Claude Sonnet", model: "openai/gpt-5",                  minTier: "elite", strength: "analysis"  },
};

const tierRank: Record<PlanTier, number> = { free: 0, pro: 1, elite: 2 };

// Resolve user's tier from profiles/subscriptions.
async function resolveTier(sb: ReturnType<typeof createClient>, userId: string): Promise<PlanTier> {
  const { data } = await sb
    .from("subscriptions")
    .select("status, price_id, renewal_date, current_period_end")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data || data.status !== "active") return "free";
  const end = data.renewal_date || data.current_period_end;
  if (end && new Date(end as string).getTime() < Date.now()) return "free";
  const k = String(data.price_id ?? "");
  if (k.startsWith("elite") || k.startsWith("ultimate")) return "elite";
  if (k.startsWith("pro")) return "pro";
  return "free";
}

// Smart intent → provider routing.
function smartRoute(message: string, tier: PlanTier): Provider {
  const m = message.toLowerCase();
  const wantsAnalysis = /(forecast|predict|analy[sz]e|deep|long.?term|simulat|wealth|portfolio|invest|risk|scenari)/.test(m);
  const wantsReasoning = /(why|explain|compare|should i|plan|strategy|trade.?off|optim[iy]z)/.test(m);
  const wantsSpeed = /(quick|fast|short|tldr|summar[iy]|brief|one.?liner)/.test(m);

  if (wantsAnalysis && tier === "elite") return "claude";
  if (wantsReasoning && tierRank[tier] >= 1) return "gpt";
  if (wantsSpeed && tierRank[tier] >= 1) return "gemini";
  return tier === "free" ? "lumo" : "gemini";
}

// Allowed providers for a given tier.
function allowedProviders(tier: PlanTier): Provider[] {
  return (Object.values(PROVIDERS) as ProviderSpec[])
    .filter((p) => tierRank[tier] >= tierRank[p.minTier])
    .map((p) => p.id);
}

interface ChatMsg { role: "user" | "assistant" | "system"; content: string }

function buildSystem(provider: Provider, persona: { id?: string; name?: string }, ctx: any): string {
  const personaName = persona?.name ?? "Personal Finance";
  const styleByProvider: Record<Provider, string> = {
    lumo:   "Warm, balanced, concise. Markdown with one ## heading + short bullets + ## Recommendation.",
    gpt:    "Highly structured, step-by-step reasoning. Markdown with numbered logic, then ## Recommendation, then ## Potential Impact (₹).",
    gemini: "Sharp, fast, compact. Markdown with a 1-line headline, 3 bullets, 1-line recommendation.",
    claude: "Deeply analytical, multi-angle. Markdown with ## Analysis (cause/effect), ## Forecast, ## Recommendation, ## Potential Impact.",
  };
  const ctxLines: string[] = [];
  if (ctx?.monthlyIncome) ctxLines.push(`Monthly income: ₹${ctx.monthlyIncome}`);
  if (ctx?.totalSpent)    ctxLines.push(`Spent this month: ₹${ctx.totalSpent}`);
  if (ctx?.topCategories?.length) ctxLines.push(`Top categories: ${ctx.topCategories.join(", ")}`);
  if (ctx?.goals?.length) ctxLines.push(`Active goals: ${ctx.goals.join("; ")}`);

  return `You are Lumo AI — a premium AI financial coach inside FinTrack AI. You are routed through the "${PROVIDERS[provider].label}" engine; respond in its native style.

Persona: ${personaName}.
Style: ${styleByProvider[provider]}

${ctxLines.length ? "User snapshot:\n" + ctxLines.join("\n") : "No personal data; stay specific and actionable."}

Rules:
- Always markdown. Use ₹ and Indian number formatting (₹1,25,000).
- Keep under ~180 words. Sharp, not chatty.
- Never name the underlying provider (OpenAI / Google / Anthropic). You are Lumo AI.
- End with one short motivating line.`;
}

async function callGateway(provider: Provider, messages: ChatMsg[], apiKey: string): Promise<{ text: string; usage?: any }> {
  const spec = PROVIDERS[provider];
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({ model: spec.model, messages, stream: false }),
  });
  if (!r.ok) {
    const errText = await r.text();
    const err: any = new Error(`gateway_${r.status}`);
    err.status = r.status;
    err.detail = errText;
    throw err;
  }
  const data = await r.json();
  return {
    text: data?.choices?.[0]?.message?.content ?? "",
    usage: data?.usage,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    let userId: string | null = null;
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await sb.auth.getClaims(token);
      userId = (data?.claims?.sub as string) ?? null;
    }

    const { message, persona = {}, history = [], context, model: requestedModel = "auto" } =
      await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tier: PlanTier = userId ? await resolveTier(sb, userId) : "free";
    const allowed = allowedProviders(tier);

    // Decide primary provider.
    let primary: Provider;
    if (requestedModel === "auto") {
      primary = smartRoute(message, tier);
    } else if ((Object.keys(PROVIDERS) as Provider[]).includes(requestedModel as Provider)) {
      const req = requestedModel as Provider;
      primary = allowed.includes(req) ? req : smartRoute(message, tier);
    } else {
      primary = smartRoute(message, tier);
    }

    // Fallback chain — primary, then other allowed providers by speed.
    const fallbackOrder: Provider[] = [
      primary,
      ...(["gemini", "lumo", "gpt", "claude"] as Provider[]).filter(
        (p) => p !== primary && allowed.includes(p),
      ),
    ];

    const baseMessages: ChatMsg[] = [
      ...history.slice(-8).map((h: any) => ({
        role: h.role === "ai" ? ("assistant" as const) : ("user" as const),
        content: String(h.text ?? h.content ?? ""),
      })),
      { role: "user", content: message },
    ];

    const started = Date.now();
    let lastErr: any = null;
    for (let i = 0; i < fallbackOrder.length; i++) {
      const provider = fallbackOrder[i];
      const messages: ChatMsg[] = [
        { role: "system", content: buildSystem(provider, persona, context) },
        ...baseMessages,
      ];
      try {
        const { text, usage } = await callGateway(provider, messages, apiKey);
        const latency = Date.now() - started;

        // Log usage (best-effort).
        if (userId) {
          await sb.from("ai_usage_logs").insert({
            user_id: userId,
            provider,
            model: PROVIDERS[provider].model,
            requested_model: requestedModel,
            prompt_tokens: usage?.prompt_tokens ?? null,
            completion_tokens: usage?.completion_tokens ?? null,
            total_tokens: usage?.total_tokens ?? null,
            latency_ms: latency,
            status: "ok",
            fallback_used: i > 0,
          });
        }

        return new Response(JSON.stringify({
          text,
          provider,
          providerLabel: PROVIDERS[provider].label,
          model: PROVIDERS[provider].model,
          fallbackUsed: i > 0,
          tier,
          latencyMs: latency,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e: any) {
        lastErr = e;
        console.error(`provider ${provider} failed`, e?.status, e?.detail);
        // Rate-limit / credit errors: surface immediately, don't burn fallbacks.
        if (e?.status === 429 || e?.status === 402) {
          if (userId) {
            await sb.from("ai_usage_logs").insert({
              user_id: userId, provider, model: PROVIDERS[provider].model,
              requested_model: requestedModel, status: "error",
              latency_ms: Date.now() - started, error: `gateway_${e.status}`,
            });
          }
          return new Response(JSON.stringify({
            error: e.status === 429 ? "Rate limit — slow down a sec." : "AI credits exhausted.",
          }), { status: e.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        // else continue to fallback
      }
    }

    if (userId) {
      await sb.from("ai_usage_logs").insert({
        user_id: userId, provider: primary, model: PROVIDERS[primary].model,
        requested_model: requestedModel, status: "error",
        latency_ms: Date.now() - started, error: String(lastErr?.message ?? "all_failed"),
      });
    }
    return new Response(JSON.stringify({ error: "AI temporarily unavailable" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-router fatal", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
