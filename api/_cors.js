const ALLOWED_ORIGINS = new Set([
  "https://chat-wisdom-ai.base44.app",
  "http://localhost:3000",
  "http://localhost:5173",
]);

export function withCors(req, res) {
  const origin = req.headers.origin;

  // Always set CORS headers
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    // Safe fallback for requests without Origin header
    // (or you can set a default allowed origin)
    res.setHeader("Access-Control-Allow-Origin", "https://chat-wisdom-ai.base44.app");
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // Preflight request must end here
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }

  return false;
}

export async function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
