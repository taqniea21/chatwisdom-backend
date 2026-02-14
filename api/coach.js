import { withCors, readJson } from "./_cors.js";
import { requireAuth } from "./_auth.js";
import { openaiChat } from "./_openai.js";

export default async function handler(req, res) {
  try {
    if (withCors(req, res)) return;

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    requireAuth(req); // throws 401 if missing

    const body = await readJson(req);
    const message = String(body?.message || "").trim();
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!message) return res.status(400).json({ error: "Missing message" });

    const messages = [
      {
        role: "system",
        content:
          "You are ChatWisdom, a helpful motivational coach. Reply in the same language as the user's latest message.",
      },
      ...history.map((m) => ({
        role: m.role,
        content: String(m.content || ""),
      })),
      { role: "user", content: message },
    ];

    const reply = await openaiChat(messages);
    return res.status(200).json({ success: true, reply });
  } catch (err) {
    console.error("COACH_ERROR:", err?.message || err);
    return res.status(err?.status || 500).json({
      error: "Internal Server Error",
      detail: err?.message || "Unknown error",
    });
  }
}
