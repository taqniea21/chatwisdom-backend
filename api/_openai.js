import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function openaiChat(messages, model = "gpt-4o-mini") {
  const r = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
  });

  return r.choices?.[0]?.message?.content?.trim() || "";
}
