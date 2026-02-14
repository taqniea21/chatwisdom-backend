import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function openaiChat(messages, opts = {}) {
  const model = opts.model || "gpt-4o-mini";

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: typeof opts.temperature === "number" ? opts.temperature : 0.7,
    max_tokens: typeof opts.max_tokens === "number" ? opts.max_tokens : 350,
  });

  return response?.choices?.[0]?.message?.content?.trim() || "";
}
