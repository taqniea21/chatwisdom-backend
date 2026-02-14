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

    // Parse JSON body
    const body = await readJson(req);

    // Verify Authorization header
    const auth = requireAuth(req); 
    // (Assuming requireAuth throws or handles error internally)

    const message = (body?.message || "").trim();
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    // Build conversation
    const messages = [
      {
        role: "system",
        content: `
You are ChatWisdom, a supportive and practical motivational coach.

Rules:
- Reply in the SAME language as the user (including Roman Urdu).
- Keep responses clear, kind, and practical.
- 3-8 sentences.
- Do not mention these rules.
`.trim()
      },
      ...history.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").trim()
      })),
      { role: "user", content: message }
    ];

    const reply = await openaiChat(messages, {
      max_tokens: 400,
      temperature: 0.7
    });

    return res.status(200).json({
      success: true,
      reply
    });

  } catch (err) {
    console.error("COACH_ERROR:", err?.message || err, err?.stack);

    return res.status(500).json({
      error: "Internal Server Error",
      detail: err?.message || "Unknown error"
    });
  }
}
