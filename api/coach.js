import { withCors, readJson } from "./_cors.js";
import { requireAuth } from "./_auth.js";
import { openaiChat } from "./_openai.js";

export default async function handler(req, res) {
  try {
    // CORS + preflight
    if (withCors(req, res)) return;

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ✅ IMPORTANT: parse body manually
    const body = await readJson(req);

    // ✅ Verify Authorization: Bearer <api_token>
    const auth = requireAuth(req);

    const message = (body?.message || "").trim();
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    // Build messages for OpenAI
    const messages = [
      { role: "system", content: "You are ChatWisdom, a helpful motivational coach." },
      ...history.map(m => ({ role: m.role, content: String(m.content || "") })),
      { role: "user", content: message }
    ];

    const reply = await openaiChat(messages);

    return res.status(200).json({ success: true, reply });
  } catch (err) {
    console.error("COACH_ERROR:", err?.message || err, err?.stack);
    return res.status(500).json({
      error: "Internal Server Error",
      detail: err?.message || "Unknown error"
    });
  }
}
