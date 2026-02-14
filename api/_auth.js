export function requireAuth(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    const err = new Error("Missing Authorization token");
    err.status = 401;
    throw err;
  }
  return token;
}
