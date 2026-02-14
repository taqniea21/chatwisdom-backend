import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Say hello from ChatWisdom backend" }
      ],
    });

    return res.status(200).json({
      success: true,
      reply: completion.choices[0].message.content,
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
