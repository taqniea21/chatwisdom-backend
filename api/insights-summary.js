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

    const entries = Array.isArray(body?.entries) ? body.entries : [];
    const language = (body?.language || "auto").trim();

    if (!entries.length) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Missing entries" }));
    }

    const lines = entries.slice(0, 20).map((e, i) => {
      const text = String(e?.entry || "").trim();
      const mood = String(e?.mood || "").trim();
      const tags = Array.isArray(e?.tags) ? e.tags.join(", ") : "";
      const dt = String(e?.created_at || "").trim();
      return `#${i + 1}${dt ? ` (${dt})` : ""}\nMood: ${mood || "unknown"}\nTags: ${tags || "-"}\nEntry: ${text}\n`;
    });

    const system = `
You are ChatWisdom Insights.

RULES:
- Reply in the SAME language as the entries (including Roman Urdu).
- Output MUST be valid JSON with keys: summary, themes, actions
- No markdown, no extra keys.

Language hint: ${language}
`.trim();

    const messages = [
      { role: "system", content: system },
      { role: "user", content: `Entries:\n\n${lines.join("\n")}` },
    ];

    const raw = await openaiChat(messages, { temperature: 0.4, max_tokens: 500 });

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const s = raw.indexOf("{");
      const e = raw.lastIndexOf("}");
      if (s !== -1 && e !== -1) parsed = JSON.parse(raw.slice(s, e + 1));
    }

    if (!parsed) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: "Bad AI response", raw: raw.slice(0, 400) }));
    }

    res.statusCode = 200;
    return res.end(JSON.stringify({
      success: true,
      summary: String(parsed.summary || "").trim(),
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    }));
  } catch (err) {
    console.error("INSIGHTS_ERROR:", err?.message || err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: "Internal Server Error", detail: err?.message || String(err) }));
  }
}
