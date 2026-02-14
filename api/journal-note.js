import { withCors, readJson } from "./_cors.js";
import { requireAuth } from "./_auth.js";
import { openaiChat, buildJournalSystemPrompt } from "./_openai.js";

export default async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "application/json");
    if (withCors(req, res)) return;

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // auth (must NOT block OPTIONS; OPTIONS already returned above)
    if (!requireAuth(req, res)) return;

    const body = await readJson(req);
    const entry = String(body?.entry || "").trim();
    const mood = String(body?.mood || "").trim();

    if (!entry) {
      return res.status(400).json({ error: "Missing entry" });
    }

    const system = buildJournalSystemPrompt(entry, mood, `
Return a coach note that:
- validates feelings
- 1-2 practical next steps
- ends with one gentle question
    `.trim());

    const messages = [
      { role: "system", content: system },
      { role: "user", content: entry },
    ];

    const note = await openaiChat({ messages, temperature: 0.5 });

    return res.status(200).json({ success: true, note });
  } catch (err) {
    console.error("JOURNAL_NOTE_ERROR:", err?.message || err, err?.stack);
    return res.status(500).json({
      error: "Internal Server Error",
      detail: err?.message || "Unknown error",
    });
  }
}
