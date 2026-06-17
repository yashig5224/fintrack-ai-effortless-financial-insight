import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: activeSub } = await admin.from("subscriptions")
      .select("plan_name, current_period_end")
      .eq("user_id", userData.user.id).eq("status", "active").maybeSingle();

    await admin.from("subscriptions")
      .update({ status: "canceled", cancel_at_period_end: true })
      .eq("user_id", userData.user.id).eq("status", "active");
    await admin.from("profiles").update({
      current_plan: "free", ai_usage_limit: 10, voice_enabled: false, premium_enabled: false,
    }).eq("id", userData.user.id);

    if (userData.user.email && activeSub) {
      admin.functions.invoke("send-email", {
        body: {
          to: userData.user.email,
          templateName: "subscription-cancelled",
          data: { endsAt: activeSub.current_period_end ?? "the end of your billing period" },
        },
      }).catch((e) => console.error("send-email", e));
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
