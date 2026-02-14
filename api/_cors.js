export function withCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://chat-wisdom-ai.base44.app");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return true;
  }
  return false;
}

export async function readJson(req) {
  // Vercel usually parses body, but Base44 sometimes triggers preflight + raw body cases
  if (req.body && typeof req.body === "object") return req.body;

  const raw = await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
