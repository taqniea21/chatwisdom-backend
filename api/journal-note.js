import { withCors, readJson } from "./_cors.js";
import { requireAuth } from "./_auth.js";
import { openaiChat } from "./_openai.js";

export default async function handler(req, res) {
  try {
    if (withCors(req, res)) return;

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    requireAuth(req);

    const body = await readJson(req);
    const entry = String(body?.entry || "").trim();
    const mood = String(body?.mood || "").trim();
    const language = String(body?.language || "auto").trim();
    const tags = Array.isArray(body?.tags) ? body.tags : [];

    if (!entry) return res.status(400).json({ error: "Missing entry" });

    const system = `
Write a short coach note for a journal entry.
Reply in the SAME language as the entry. If entry is English, reply in English.
Length 3-6 sentences. Practical, kind, supportive.
Mood: ${mood || "unknown"}
Tags: ${tags.join(", ")}
Language hint: ${language}
`.trim();

    const reply = await openaiChat([
      { role: "system", content: system },
      { role: "user", content: entry },
    ]);

    return res.status(200).json({ success: true, reply });
  } catch (err) {
    console.error("JOURNAL_NOTE_ERROR:", err?.message || err);
    return res.status(err?.status || 500).json({
      error: "Internal Server Error",
      detail: err?.message || "Unknown error",
    });
  }
}
