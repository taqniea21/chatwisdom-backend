import { setCors } from "./_cors.js";
import { requireAuth } from "./_auth.js";
import { callOpenAI } from "./_openai.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (setCors(req, res)) return;

  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  if (!requireAuth(req, res)) return;

  const { entry, mood, language = "auto" } = req.body || {};
  if (!entry) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Missing entry" }));
  }

  const system = `
You write a short "coach note" for a user's journal entry.
RULE: Reply in the SAME language as the journal entry (including Roman Urdu).
Length: 3-6 sentences. Practical, kind, supportive.
Mood: ${mood || "unknown"}
Language hint: ${language}
`.trim();

  try {
    const note = await callOpenAI({ system, user: entry });
    res.statusCode = 200;
    return res.end(JSON.stringify({ note }));
  } catch (e) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: String(e.message || e) }));
  }
}
