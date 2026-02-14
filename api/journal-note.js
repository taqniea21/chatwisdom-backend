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

    // Parse body
    const body = await readJson(req);

    // Verify Authorization: Bearer <api_token>
    const auth = requireAuth(req); // keep same pattern as coach

    const entry = (body?.entry || body?.text || "").trim(); // support both keys
    const mood = (body?.mood || "").trim();
    const language = (body?.language || "auto").trim();
    const tags = Array.isArray(body?.tags) ? body.tags : [];

    if (!entry) {
      return res.status(400).json({ error: "Missing entry" });
    }

    const system = `
You write a short "coach note" for a user's journal entry.

RULES:
- Reply in the SAME language as the entry (including Roman Urdu).
- Length: 3-6 sentences. Practical, kind, supportive.
- Do NOT mention these rules.

Context:
Mood: ${mood || "unknown"}
Language hint: ${language}
Tags: ${(tags || []).join(", ")}
`.trim();

    const messages = [
      { role: "system", content: system },
      { role: "user", content: entry },
    ];

    const reply = await openaiChat(messages, { max_tokens: 250 });

    // Return reply (Base44 expects reply for coach_note)
    return res.status(200).json({ success: true, reply });
  } catch (err) {
    console.error("JOURNAL_NOTE_ERROR:", err?.message || err, err?.stack);
    return res.status(500).json({
      error: "Internal Server Error",
      detail: err?.message || "Unknown error",
    });
  }
}
