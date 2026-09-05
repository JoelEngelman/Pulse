import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json({ error: "Pulse AI is not configured on the server." }, 503);
  try {
    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return json({ error: "Message is required." }, 400);
    if (message.length > 12000) return json({ error: "Message is too long." }, 400);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        instructions: "You are Pulse AI, the built-in assistant for Pulse. Be helpful, natural, concise, and friendly. Help users brainstorm, write, rewrite, summarize, and understand things. Do not claim to have access to private Pulse data unless it is explicitly provided in the conversation.",
        input: message,
        max_output_tokens: 1200,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("OpenAI error", response.status, data);
      return json({ error: "Pulse AI could not generate a response right now." }, 502);
    }
    return json({ response: data.output_text ?? "I couldn't generate a response." });
  } catch (error) {
    console.error("Pulse AI error", error);
    return json({ error: "Pulse AI could not generate a response right now." }, 500);
  }
});
