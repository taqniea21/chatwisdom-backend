export function requireAuth(req) {
  const h = req.headers?.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    const e = new Error("Missing Authorization Bearer token");
    e.status = 401;
    throw e;
  }
  return m[1]; // api_token (you can validate later)
}
