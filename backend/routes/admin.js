import { Router } from "express";
import { adminCurrentUser, adminLogin, adminOverview } from "../app/Controllers/AdminAuthController.js";
import {
  adminCategories,
  adminCreateCategory,
  adminDeleteCategory,
  adminUpdateCategory
} from "../app/Controllers/AdminCategoryController.js";
import {
  adminCreateUser,
  adminDeleteUser,
  adminUpdateUser,
  adminUsers
} from "../app/Controllers/AdminUserController.js";
import {
  adminCreatePackage,
  adminDeletePackage,
  adminPackages,
  adminUpdatePackage
} from "../app/Controllers/AdminPackageController.js";
import {
  adminCreateQuestionSet,
  adminDeleteQuestionSet,
  adminQuestionSets,
  adminUpdateQuestionSet
} from "../app/Controllers/AdminQuestionSetController.js";
import {
  adminCreateQuestion,
  adminDeleteQuestion,
  adminQuestions,
  adminUpdateQuestion
} from "../app/Controllers/AdminQuestionController.js";
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

// Quản lý người dùng
router.get("/users", requireAdmin, adminUsers);
router.post("/users", requireAdmin, adminCreateUser);
router.patch("/users/:id", requireAdmin, adminUpdateUser);
router.delete("/users/:id", requireAdmin, adminDeleteUser);

// Quản lý chủ đề / thời kỳ lịch sử
router.get("/categories", requireAdmin, adminCategories);
router.post("/categories", requireAdmin, adminCreateCategory);
router.patch("/categories/:id", requireAdmin, adminUpdateCategory);
router.delete("/categories/:id", requireAdmin, adminDeleteCategory);

// Quản lý gói câu hỏi
router.get("/packages", requireAdmin, adminPackages);
router.post("/packages", requireAdmin, adminCreatePackage);
router.patch("/packages/:id", requireAdmin, adminUpdatePackage);
router.delete("/packages/:id", requireAdmin, adminDeletePackage);

// Quản lý bộ câu hỏi (chặng) trong từng gói
router.get("/question-sets", requireAdmin, adminQuestionSets);
router.post("/question-sets", requireAdmin, adminCreateQuestionSet);
router.patch("/question-sets/:id", requireAdmin, adminUpdateQuestionSet);
router.delete("/question-sets/:id", requireAdmin, adminDeleteQuestionSet);

// Quản lý ngân hàng câu hỏi (trắc nghiệm 4 lựa chọn)
router.get("/questions", requireAdmin, adminQuestions);
router.post("/questions", requireAdmin, adminCreateQuestion);
router.patch("/questions/:id", requireAdmin, adminUpdateQuestion);
router.delete("/questions/:id", requireAdmin, adminDeleteQuestion);

export default router;
