export function requireAuth(req, res) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  const expected = process.env.CHATWISDOM_API_TOKEN;

  if (!expected) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Server missing CHATWISDOM_API_TOKEN" }));
    return null;
  }

  if (!token || token !== expected) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return null;
  }

  return { ok: true };
}
