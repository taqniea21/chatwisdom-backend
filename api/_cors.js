export function setCors(req, res) {
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
