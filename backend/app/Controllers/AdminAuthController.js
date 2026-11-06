import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Attempt from "../Models/Attempt.js";
import Category from "../Models/Category.js";
import Package from "../Models/Package.js";
import QuestionSet from "../Models/QuestionSet.js";
import User from "../Models/User.js";

const adminSecret = () => process.env.ADMIN_JWT_SECRET || "local-admin-development-secret";
const sessionHours = () => Number(process.env.ADMIN_SESSION_HOURS) || 2;

// Hash giả để thời gian phản hồi khi email không tồn tại tương đương khi email tồn tại.
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.pJ0sVBRQ8W3kmVj6THN8XKZ5E0lHmvK";

// Dùng chung một thông báo cho mọi trường hợp thất bại để không lộ email quản trị nào tồn tại.
const INVALID_CREDENTIALS = "Email hoặc mật khẩu không chính xác.";

function createAdminToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: "admin", scope: "admin", name: user.name || user.fullName },
    adminSecret(),
    { expiresIn: `${sessionHours()}h` }
  );
}

function adminUser(user) {
  return {
    id: user._id.toString(),
    name: user.name || user.fullName,
    email: user.email,
    role: user.role,
    avatar: user.avatar || ""
  };
}

export async function adminLogin(request, response) {
  const { email, password } = request.body || {};

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return response.status(400).json({ message: "Vui lòng nhập email và mật khẩu quản trị." });
  }

  if (!process.env.ADMIN_JWT_SECRET) {
    console.warn("[admin-auth] ADMIN_JWT_SECRET chưa được cấu hình, đang dùng secret phát triển cục bộ.");
  }

  let user = null;
  try {
    user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
  } catch {
    return response.status(500).json({ message: "Không thể kết nối cơ sở dữ liệu. Vui lòng thử lại." });
  }

  const passwordMatches = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !passwordMatches) {
    return response.status(401).json({ message: INVALID_CREDENTIALS });
  }

  // Tài khoản không phải admin: trả cùng thông báo với trường hợp sai mật khẩu để không lộ email quản trị nào tồn tại.
  if (user.role !== "admin") {
    return response.status(401).json({ message: INVALID_CREDENTIALS });
  }

  if (user.status === "locked") {
    return response.status(403).json({ message: "Tài khoản quản trị đang bị khoá." });
  }

  response.json({ token: createAdminToken(user), user: adminUser(user) });
}

export async function adminCurrentUser(request, response) {
  const user = await User.findById(request.user.sub);
  if (!user || user.role !== "admin") {
    return response.status(403).json({ message: "Tài khoản không có quyền truy cập trang quản trị." });
  }
  response.json({ user: adminUser(user) });
}

export async function adminOverview(_request, response) {
  const [students, admins, packages, questionSets, attempts] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "admin" }),
    Package.countDocuments({}),
    QuestionSet.countDocuments({}),
    Attempt.countDocuments({})
  ]);

  const latestUsers = await User.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .select("name fullName email role status createdAt")
    .lean();

  const latestAttempts = await Attempt.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .select("studentName score correctAnswers totalQuestions accuracy completedAt createdAt")
    .lean();

  response.json({
    totals: { students, admins, packages, questionSets, attempts, categories: await Category.countDocuments({}) },
    latestUsers: latestUsers.map((user) => ({
      id: user._id.toString(),
      name: user.name || user.fullName || "Chưa đặt tên",
      email: user.email,
      role: user.role,
      status: user.status || "active",
      createdAt: user.createdAt
    })),
    latestAttempts: latestAttempts.map((attempt) => ({
      id: attempt._id.toString(),
      studentName: attempt.studentName,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      accuracy: attempt.accuracy,
      completedAt: attempt.completedAt || attempt.createdAt
    }))
  });
}
