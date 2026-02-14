const ALLOWED_ORIGINS = new Set([
  "https://chat-wisdom-ai.base44.app",
  "http://localhost:3000",
  "http://localhost:5173",
]);

function applyCors(req, res) {
  const origin = req.headers.origin;

  // If request has an allowed Origin, echo it back; otherwise allow all (safe for MVP)
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "*";

  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // ✅ Preflight must return before auth/logic
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

// Backward compatible exports (some files call setCors, some call withCors)
export function setCors(req, res) {
  return applyCors(req, res);
}

export function withCors(req, res) {
  return applyCors(req, res);
}

// If you are manually parsing body in coach/insights
export async function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}
