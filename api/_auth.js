export function requireAuth(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    if (res) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "Missing Authorization Bearer token" }));
    }
    throw new Error("Missing Authorization token");
  }

  // For now we only validate token exists.
  // Later you can verify it against Base44 UserProfile if needed.
  return { token };
}
