// Lumo AI chat — Lovable AI Gateway (no API keys required from user)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage { role: "user" | "assistant" | "system"; content: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, persona, history = [], context } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const personaName = persona?.name ?? "Personal Finance";
    const personaId = persona?.id ?? "general";
    const ctxLines: string[] = [];
    if (context?.monthlyIncome) ctxLines.push(`Monthly income: ₹${context.monthlyIncome}`);
    if (context?.totalSpent) ctxLines.push(`Spent this month: ₹${context.totalSpent}`);
    if (context?.topCategories?.length) ctxLines.push(`Top categories: ${context.topCategories.join(", ")}`);
    if (context?.goals?.length) ctxLines.push(`Active goals: ${context.goals.join("; ")}`);

    const system = `You are Lumo AI, a warm, sharp personal finance coach inside FinTrack AI.
Persona context: ${personaName} (${personaId}).
${ctxLines.length ? "User financial snapshot:\n" + ctxLines.join("\n") : "No financial data available — answer generally but stay actionable."}

Style:
- Be concise (2-4 short paragraphs max).
- Use plain language, INR (₹), bullet points when helpful.
- Always end with one concrete next step.
- Never refuse generic personal-finance questions.
- Do not mention OpenAI, Google, Anthropic, or any provider.`;

    const messages: ChatMessage[] = [
      { role: "system", content: system },
      ...history.slice(-8).map((m: any) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: String(m.text ?? m.content ?? ""),
      })),
      { role: "user", content: message },
    ];

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: false,
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("AI gateway error", r.status, errText);
      const status = r.status === 429 || r.status === 402 ? r.status : 500;
      return new Response(JSON.stringify({
        error: r.status === 429 ? "Rate limit — slow down a sec." :
               r.status === 402 ? "AI credits exhausted. Add credits in Workspace → Usage." :
               "AI temporarily unavailable.",
      }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content ?? "I couldn't generate a response. Try again.";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lumo-chat error", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
