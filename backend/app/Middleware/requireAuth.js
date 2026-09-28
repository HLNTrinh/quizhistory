import jwt from "jsonwebtoken";

export function requireAuth(request, response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return response.status(401).json({ message: "Vui lòng đăng nhập để tiếp tục." });

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET || "local-development-secret");
    next();
  } catch {
    response.status(401).json({ message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." });
  }
}