import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Say hello from ChatWisdom backend" }
      ],
    });

    res.status(200).json({
      success: true,
      reply: response.choices[0].message.content,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
}
