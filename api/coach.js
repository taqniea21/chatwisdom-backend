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

  const { message, language = "auto", mode = "coach" } = req.body || {};
  if (!message) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Missing message" }));
  }

  const system = `
You are ChatWisdom: a calm, supportive coaching assistant.
RULE: Reply in the SAME language as the user's latest message.
If the user's message is Roman Urdu, reply in Roman Urdu.
Keep tone warm and coach-like. If user wrote long message, reply with a longer helpful answer.

Mode: ${mode}
Language hint: ${language}
`.trim();

  try {
    const reply = await callOpenAI({ system, user: message });
    res.statusCode = 200;
    return res.end(JSON.stringify({ reply }));
  } catch (e) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: String(e.message || e) }));
  }
}
