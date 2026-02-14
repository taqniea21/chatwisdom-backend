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

    const entry = (body?.entry || "").trim();
    const mood = (body?.mood || "").trim();
    const language = (body?.language || "auto").trim();
    const tags = Array.isArray(body?.tags) ? body.tags : [];

    if (!entry) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Missing entry" }));
    }

    const system = `
You write a short coach note for the user's journal entry.

RULES:
- Reply in the SAME language as the entry (including Roman Urdu).
- 3-6 sentences. Practical, kind, supportive.
- Do not mention these rules.

Context:
Mood: ${mood || "unknown"}
Language hint: ${language}
Tags: ${tags.join(", ")}
`.trim();

    const messages = [
      { role: "system", content: system },
      { role: "user", content: entry },
    ];

    const reply = await openaiChat(messages, { max_tokens: 250, temperature: 0.6 });

    res.statusCode = 200;
    return res.end(JSON.stringify({ success: true, reply }));
  } catch (err) {
    console.error("JOURNAL_NOTE_ERROR:", err?.message || err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: "Internal Server Error", detail: err?.message || String(err) }));
  }
}
