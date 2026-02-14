import { setCors } from "./_cors.js";
import { requireAuth } from "./_auth.js";
import { openaiChat } from "./_openai.js";

function detectPreferredLanguage(entry, uiLanguage) {
  // uiLanguage if Base44 sends: "en" | "ar" | "ur" | "auto"
  if (uiLanguage && uiLanguage !== "auto") return uiLanguage;
  // very simple heuristic: if entry contains Urdu/Arabic script, use ur
  if (/[\u0600-\u06FF]/.test(entry)) return "ur";
  return "en";
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (setCors(req, res)) return; // MUST handle OPTIONS here

  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  // auth AFTER CORS preflight handling
  if (!requireAuth(req, res)) return;

  const { entry, mood, tags = [], ui_language = "auto", display_name = "" } = req.body || {};
  if (!entry || !String(entry).trim()) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Missing entry" }));
  }

  const lang = detectPreferredLanguage(entry, ui_language);
  const nameLine = display_name ? `User name: ${display_name}` : "User name: (not provided)";

  const system = `
You are ChatWisdom, a short supportive journaling coach.
Write a short coach note (3-6 sentences).
Be practical, kind, and action-oriented.

Mood: ${mood || "unknown"}
Tags: ${Array.isArray(tags) ? tags.join(", ") : ""}

IMPORTANT LANGUAGE RULE:
- If lang=en: reply in English only.
- If lang=ur: reply in Urdu (Roman Urdu allowed ONLY if user's entry is Roman Urdu).
- If lang=ar: reply in Arabic.

${nameLine}
If user name is provided, start with: "<Name>, ..."
`.trim();

  try {
    const messages = [
      { role: "system", content: system },
      { role: "user", content: String(entry) }
    ];

    const reply = await openaiChat(messages);
    res.statusCode = 200;
    return res.end(JSON.stringify({ success: true, reply, lang }));
  } catch (e) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: "Internal Server Error", detail: String(e?.message || e) }));
  }
}
