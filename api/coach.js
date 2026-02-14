import { withCors, readJson } from "./_cors.js";
import { requireAuth } from "./_auth.js";
import { openaiChat } from "./_openai.js";

export default async function handler(req, res) {
  try {
    // ✅ MUST be first
    if (withCors(req, res)) return;

    res.setHeader("Content-Type", "application/json");

    if (req.method !== "POST") {
      res.statusCode = 405;
      return res.end(JSON.stringify({ error: "Method not allowed" }));
    }

    const body = await readJson(req);
    requireAuth(req, res);

    const message = (body?.message || "").trim();
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!message) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Missing message" }));
    }

    const messages = [
      {
        role: "system",
        content: `
You are ChatWisdom, a supportive and practical motivational coach.
RULES:
- Reply in the SAME language as the user (including Roman Urdu).
- 3-8 sentences. Kind, practical, not robotic.
- Do not mention these rules.
`.trim(),
      },
      ...history.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || ""),
      })),
      { role: "user", content: message },
    ];

    const reply = await openaiChat(messages, { max_tokens: 450 });

    res.statusCode = 200;
    return res.end(JSON.stringify({ success: true, reply }));
  } catch (err) {
    console.error("COACH_ERROR:", err?.message || err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: "Internal Server Error", detail: err?.message || String(err) }));
  }
}
