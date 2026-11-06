import jwt from "jsonwebtoken";

const secret = () => process.env.JWT_SECRET || "local-development-secret";

// Secret riêng cho phiên quản trị: token của học sinh không thể dùng cho route admin.
const adminSecret = () => process.env.ADMIN_JWT_SECRET || "local-admin-development-secret";

export function requireAuth(request, response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return response.status(401).json({ message: "Vui lòng đăng nhập để tiếp tục." });

  try {
    request.user = jwt.verify(token, secret());
    next();
  } catch {
    response.status(401).json({ message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." });
  }
}

export function optionalAuth(request, _response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (token) {
    try {
      request.user = jwt.verify(token, secret());
    } catch {
      request.user = undefined;
    }
  }
  next();
}

export function requireAdmin(request, response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return response.status(401).json({ message: "Vui lòng đăng nhập bằng tài khoản quản trị." });
  }

  try {
    const payload = jwt.verify(token, adminSecret());
    if (payload.role !== "admin" || payload.scope !== "admin") {
      return response.status(403).json({ message: "Tài khoản không có quyền truy cập trang quản trị." });
    }
    request.user = payload;
    next();
  } catch {
    response.status(401).json({ message: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." });
  }
}
