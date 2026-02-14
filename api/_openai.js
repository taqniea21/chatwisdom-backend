export async function callOpenAI({ system, user, model = "gpt-4o-mini" }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })
  });

  const data = await r.json();
  if (!r.ok) {
    throw new Error(data?.error?.message || "OpenAI error");
  }

  return data.choices?.[0]?.message?.content || "";
}
