import { setCors } from "./_cors.js";
import { requireAuth } from "./_auth.js";
import { openaiChat } from "./_openai.js";

function detectPreferredLanguage(text, uiLanguage) {
  if (uiLanguage && uiLanguage !== "auto") return uiLanguage;
  if (/[\u0600-\u06FF]/.test(text)) return "ur";
  return "en";
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (setCors(req, res)) return;

  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  if (!requireAuth(req, res)) return;

  const { message = "", history = [], ui_language = "auto", display_name = "" } = req.body || {};
  const userMsg = String(message).trim();
  if (!userMsg) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Missing message" }));
  }

  const lang = detectPreferredLanguage(userMsg, ui_language);
  const nameLine = display_name ? `User name: ${display_name}` : "User name: (not provided)";

  const system = `
You are ChatWisdom, a supportive motivational coach.
Be concise, actionable, and kind.

IMPORTANT LANGUAGE RULE:
- If lang=en: reply in English only.
- If lang=ur: reply in Urdu (Roman Urdu allowed ONLY if user uses Roman Urdu).
- If lang=ar: reply in Arabic.

${nameLine}
If user name is provided, you may address them by name sometimes.
`.trim();

  try {
    const safeHistory = Array.isArray(history) ? history.slice(-6) : [];
    const messages = [
      { role: "system", content: system },
      ...safeHistory.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "")
      })),
      { role: "user", content: userMsg }
    ];

    const reply = await openaiChat(messages);
    res.statusCode = 200;
    return res.end(JSON.stringify({ success: true, reply, lang }));
  } catch (e) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: "Internal Server Error", detail: String(e?.message || e) }));
  }
}
