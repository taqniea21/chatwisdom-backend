import { withCors, readJson } from "./_cors.js";
import { requireAuth } from "./_auth.js";
import { openaiChat, detectLangPublic } from "./_openai.js";

function computeMoodStats(entries = []) {
  const counts = {};
  for (const e of entries) {
    const mood = String(e?.mood || "unknown");
    counts[mood] = (counts[mood] || 0) + 1;
  }
  const total = entries.length;
  let topMood = "unknown";
  let topMoodCount = 0;
  for (const k of Object.keys(counts)) {
    if (counts[k] > topMoodCount) {
      topMood = k;
      topMoodCount = counts[k];
    }
  }
  return { total, counts, topMood, topMoodCount };
}

export default async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "application/json");
    if (withCors(req, res)) return;

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!requireAuth(req, res)) return;

    const body = await readJson(req);
    const entries = Array.isArray(body?.entries) ? body.entries : [];

    if (entries.length === 0) {
      return res.status(400).json({ error: "Missing entries" });
    }

    // build compact text for LLM
    const rows = entries
      .slice(0, 30)
      .map((e, idx) => {
        const dt = e?.created_at ? String(e.created_at) : "";
        const mood = e?.mood ? String(e.mood) : "unknown";
        const entry = String(e?.entry || "").replace(/\s+/g, " ").trim();
        return `${idx + 1}) [${dt}] mood=${mood} entry="${entry}"`;
      })
      .join("\n");

    const stats = computeMoodStats(entries);

    // choose language based on majority of entries text
    const sampleText = entries.map(e => e?.entry || "").join(" ").slice(0, 2000);
    const lang = detectLangPublic(sampleText);

    const langRule =
      lang === "ur"
        ? "Write ONLY in Urdu (اردو) script. Do NOT use Roman Urdu."
        : lang === "roman_ur"
        ? "Write ONLY in Roman Urdu."
        : "Write ONLY in English.";

    const system = `
You are ChatWisdom analytics assistant.
${langRule}

You must produce JSON ONLY (no markdown).
Return:
{
  "summary": "2-4 sentences",
  "patterns": ["...","...","..."],
  "mood_overview": {
    "top_mood": "${stats.topMood}",
    "counts": ${JSON.stringify(stats.counts)}
  },
  "actions": ["3 concrete next steps"],
  "reflection_questions": ["2 questions"]
}

Notes:
- Use the provided mood counts; don't invent numbers.
- Patterns should reference what user wrote (work stress, sleep, etc.).
    `.trim();

    const messages = [
      { role: "system", content: system },
      {
        role: "user",
        content: `Entries:\n${rows}\n\nMood stats: ${JSON.stringify(stats)}`,
      },
    ];

    const out = await openaiChat({ messages, temperature: 0.3 });

    // If model returns non-JSON sometimes, still pass through (frontend can handle)
    return res.status(200).json({ success: true, result: out });
  } catch (err) {
    console.error("INSIGHTS_ERROR:", err?.message || err, err?.stack);
    return res.status(500).json({
      error: "Internal Server Error",
      detail: err?.message || "Unknown error",
    });
  }
}
