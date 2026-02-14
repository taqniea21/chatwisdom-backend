import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function detectLanguage(text = "") {
  const t = String(text);

  // Urdu/Arabic script detection
  const hasUrduArabic = /[\u0600-\u06FF\u0750-\u077F]/.test(t);

  // Basic Latin letters count
  const latin = (t.match(/[A-Za-z]/g) || []).length;

  // Roman Urdu heuristic: latin + common urdu roman words
  const romanHint = /\b(mera|meri|mujhe|tum|aap|hai|hain|nahi|kyun|kya|kaise|please|plz)\b/i.test(t);

  if (hasUrduArabic) return "ur";
  if (latin > 0 && romanHint) return "roman_ur";
  return "en";
}

export async function openaiChat({ messages, temperature = 0.4 }) {
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature,
  });
  return resp.choices?.[0]?.message?.content?.trim() || "";
}

export function buildCoachSystemPrompt(latestUserText, extra = "") {
  const lang = detectLanguage(latestUserText);

  const langRule =
    lang === "ur"
      ? "Reply ONLY in Urdu (اردو) script. Do NOT use Roman Urdu."
      : lang === "roman_ur"
      ? "Reply ONLY in Roman Urdu (Urdu in English letters)."
      : "Reply ONLY in English.";

  return `
You are ChatWisdom, a practical, kind motivational coach.
IMPORTANT LANGUAGE RULE:
- ${langRule}
- Follow the language of the LATEST user message ONLY.
- Ignore the language used in chat history.

Style:
- Warm, supportive, no lecture.
- Short paragraphs, actionable steps.
- Avoid medical/legal claims.

${extra || ""}
  `.trim();
}

export function buildJournalSystemPrompt(entryText, mood, extra = "") {
  const lang = detectLanguage(entryText);

  const langRule =
    lang === "ur"
      ? "Write ONLY in Urdu (اردو) script. Do NOT use Roman Urdu."
      : lang === "roman_ur"
      ? "Write ONLY in Roman Urdu (Urdu in English letters)."
      : "Write ONLY in English.";

  return `
You write a short "coach note" for a user's journal entry.
IMPORTANT LANGUAGE RULE:
- ${langRule}
- Follow the language of the JOURNAL ENTRY ONLY.

Length: 3-6 sentences. Practical, kind, supportive.
Mood: ${mood || "unknown"}

  `.trim() + (extra ? `\n\n${extra}` : "");
}

export function detectLangPublic(text) {
  return detectLanguage(text);
}
