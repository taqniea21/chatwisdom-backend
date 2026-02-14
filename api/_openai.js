import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function openaiChat(messages) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing in Vercel env");

  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.7
  });

  return r.choices?.[0]?.message?.content?.trim() || "";
}
