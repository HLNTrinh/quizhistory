import { Router } from "express";
import { adminCurrentUser, adminLogin, adminOverview } from "../app/Controllers/AdminAuthController.js";
import { requireAdmin } from "../app/Middleware/requireAuth.js";
import { createRateLimiter } from "../app/Middleware/rateLimit.js";

const router = Router();

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.",
  // Khoá theo IP + email: tránh một người dùng chung proxy làm khoá tài khoản của người khác.
  keyGenerator: (request) => `${request.ip || request.socket?.remoteAddress || "unknown"}|${String(request.body?.email || "").trim().toLowerCase()}`
});

router.post("/auth/login", loginLimiter, adminLogin);
router.get("/auth/me", requireAdmin, adminCurrentUser);
router.get("/overview", requireAdmin, adminOverview);

export default router;
