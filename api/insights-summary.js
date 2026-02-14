import { withCors, readJson } from "./_cors.js";
import { requireAuth } from "./_auth.js";
import { openaiChat } from "./_openai.js";

export default async function handler(req, res) {
  try {
    // ✅ CORS + preflight
    if (withCors(req, res)) return;

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ✅ Auth
    requireAuth(req);

    // ✅ Parse body
    const body = await readJson(req);
    const entries = Array.isArray(body?.entries) ? body.entries : [];

    if (!entries.length) {
      return res.status(400).json({ error: "Missing entries" });
    }

    // Build summary text from entries
    const journalText = entries
      .map(e => `Date: ${e.created_at}\nMood: ${e.mood}\nEntry: ${e.entry}`)
      .join("\n\n");

    const messages = [
      {
        role: "system",
        content: `
You are ChatWisdom Insights Analyzer.

Return JSON ONLY in this format:
{
  "summary": "...",
  "mood_overview": {
    "counts": {},
    "dominant_mood": ""
  },
  "patterns": "...",
  "actions": ["...", "..."],
  "reflection_questions": ["...", "..."]
}

Analyze:
- Mood frequency
- Mood shifts
- Patterns
- Provide practical advice
- Keep summary structured
`
      },
      {
        role: "user",
        content: journalText
      }
    ];

    const reply = await openaiChat(messages);

    return res.status(200).json({
      success: true,
      result: reply
    });

  } catch (err) {
    console.error("INSIGHTS_ERROR:", err?.message || err);
    return res.status(500).json({
      error: "Internal Server Error",
      detail: err?.message || "Unknown error"
    });
  }
}
