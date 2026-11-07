// backend/app/Controllers/AdminUserController.js
// Quản trị người dùng: danh sách (tìm kiếm, lọc, sắp xếp, phân trang) kèm thống kê thật từ MongoDB.
// Các thao tác ghi (tạo / cập nhật / xóa) đều kiểm tra quyền và bảo vệ quản trị viên đang hoạt động cuối cùng.
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Attempt from "../Models/Attempt.js";
import Progress from "../Models/Progress.js";
import QuestionSet from "../Models/QuestionSet.js";
import Ranking from "../Models/Ranking.js";
import User from "../Models/User.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const ROLES = ["student", "admin"];
const STATUSES = ["active", "locked"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SORT_ORDERS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  name: { name: 1, fullName: 1 },
  score: { totalScore: -1, createdAt: -1 }
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countByKey(rows, key) {
  return rows.find((row) => row._id === key)?.count || 0;
}

function sumCounts(rows) {
  return rows.reduce((total, row) => total + row.count, 0);
}

function serializeUser(user, attemptRow) {
  const completedSets = Array.isArray(attemptRow?.completedSetIds)
    ? attemptRow.completedSetIds.filter((id) => Boolean(id)).length
    : 0;

  return {
    id: user._id.toString(),
    name: user.name || user.fullName || user.email,
    email: user.email,
    role: ROLES.includes(user.role) ? user.role : "student",
    status: user.status === "locked" ? "locked" : "active",
    avatar: user.avatar || "",
    totalScore: Math.round(user.totalScore || 0),
    attempts: attemptRow?.attempts || 0,
    completedAttempts: attemptRow?.completed || 0,
    completedSets,
    avgAccuracy: Number.isFinite(attemptRow?.avgAccuracy) ? Math.round(attemptRow.avgAccuracy) : null,
    lastActiveAt: attemptRow?.lastActiveAt || null,
    joinedAt: user.createdAt || null
  };
}

// Số quản trị viên đang hoạt động còn lại (trừ tài khoản đang xét).
function countOtherActiveAdmins(userId) {
  return User.countDocuments({ _id: { $ne: userId }, role: "admin", status: { $ne: "locked" } });
}

export async function adminUsers(request, response) {
  const search = typeof request.query.q === "string" ? request.query.q.trim() : "";
  const role = request.query.role;
  const status = request.query.status;
  const sort = SORT_ORDERS[request.query.sort] ? request.query.sort : "newest";
  const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(request.query.limit, 10) || 10));

  const filter = {};
  if (search) {
    const pattern = new RegExp(escapeRegExp(search), "i");
    filter.$or = [{ name: pattern }, { fullName: pattern }, { email: pattern }];
  }
  if (ROLES.includes(role)) filter.role = role;
  // Tài khoản cũ có thể chưa có field status: coi như đang hoạt động.
  if (status === "active") filter.status = { $ne: "locked" };
  else if (status === "locked") filter.status = "locked";

  const since7 = new Date(Date.now() - 7 * DAY_MS);
  const since30 = new Date(Date.now() - 30 * DAY_MS);

  const [total, userRows, roleRows, statusRows, newUsers7d, newUsers30d, questionSets] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort(SORT_ORDERS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name fullName email role status avatar totalScore createdAt")
      .lean(),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: { $ifNull: ["$status", "active"] }, count: { $sum: 1 } } }]),
    User.countDocuments({ role: "student", createdAt: { $gte: since7 } }),
    User.countDocuments({ role: "student", createdAt: { $gte: since30 } }),
    QuestionSet.countDocuments({})
  ]);

  const userIds = userRows.map((user) => user._id).filter((id) => mongoose.isValidObjectId(id));
  const attemptRows = userIds.length
    ? await Attempt.aggregate([
      { $match: { userId: { $in: userIds } } },
      {
        $group: {
          _id: "$userId",
          attempts: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          avgAccuracy: { $avg: { $cond: [{ $eq: ["$status", "completed"] }, "$accuracy", null] } },
          lastActiveAt: { $max: "$createdAt" },
          completedSetIds: { $addToSet: { $cond: [{ $eq: ["$status", "completed"] }, "$questionSetId", null] } }
        }
      }
    ])
    : [];

  const attemptByUser = new Map(attemptRows.map((row) => [row._id.toString(), row]));
  const totalUsers = sumCounts(roleRows);
  const activeUsers = countByKey(statusRows, "active");

  response.json({
    generatedAt: new Date().toISOString(),
    stats: {
      total: totalUsers,
      students: countByKey(roleRows, "student"),
      admins: countByKey(roleRows, "admin"),
      active: activeUsers,
      locked: Math.max(0, totalUsers - activeUsers),
      activeRatio: totalUsers ? Math.round((activeUsers / totalUsers) * 1000) / 10 : 0,
      newUsers7d,
      newUsers30d,
      questionSets
    },
    items: userRows.map((user) => serializeUser(user, attemptByUser.get(user._id.toString()))),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  });
}

export async function adminCreateUser(request, response) {
  const { fullName, email, password, role = "student", status = "active" } = request.body || {};

  if (typeof fullName !== "string" || fullName.trim().length < 2) {
    return response.status(400).json({ message: "Vui lòng nhập họ tên người dùng (ít nhất 2 ký tự)." });
  }
  if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
    return response.status(400).json({ message: "Địa chỉ email chưa hợp lệ." });
  }
  if (typeof password !== "string" || password.length < 8) {
    return response.status(400).json({ message: "Mật khẩu khởi tạo cần có ít nhất 8 ký tự." });
  }
  if (!ROLES.includes(role)) {
    return response.status(400).json({ message: "Vai trò tài khoản không hợp lệ." });
  }
  if (!STATUSES.includes(status)) {
    return response.status(400).json({ message: "Trạng thái tài khoản không hợp lệ." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    return response.status(409).json({ message: "Email này đã được sử dụng cho tài khoản khác." });
  }

  try {
    const user = await User.create({
      name: fullName.trim().slice(0, 80),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      status
    });
    response.status(201).json({ user: serializeUser(user) });
  } catch (error) {
    if (error?.code === 11000) {
      return response.status(409).json({ message: "Email này đã được sử dụng cho tài khoản khác." });
    }
    throw error;
  }
}

export async function adminUpdateUser(request, response) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    return response.status(400).json({ message: "Mã người dùng không hợp lệ." });
  }

  const user = await User.findById(id);
  if (!user) {
    return response.status(404).json({ message: "Không tìm thấy người dùng cần cập nhật." });
  }

  const body = request.body || {};
  const isSelf = request.user?.sub === id;
  const before = { role: user.role, status: user.status === "locked" ? "locked" : "active" };
  let changed = false;

  if (body.fullName !== undefined) {
    if (typeof body.fullName !== "string" || body.fullName.trim().length < 2) {
      return response.status(400).json({ message: "Họ tên người dùng cần có ít nhất 2 ký tự." });
    }
    const name = body.fullName.trim().slice(0, 80);
    user.name = name;
    user.fullName = name;
    changed = true;
  }

  if (body.email !== undefined) {
    if (typeof body.email !== "string" || !EMAIL_PATTERN.test(body.email.trim())) {
      return response.status(400).json({ message: "Địa chỉ email chưa hợp lệ." });
    }
    const normalizedEmail = body.email.trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      if (await User.exists({ email: normalizedEmail, _id: { $ne: user._id } })) {
        return response.status(409).json({ message: "Email này đã được sử dụng cho tài khoản khác." });
      }
      user.email = normalizedEmail;
    }
    changed = true;
  }

  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) {
      return response.status(400).json({ message: "Vai trò tài khoản không hợp lệ." });
    }
    if (isSelf && body.role !== "admin") {
      return response.status(409).json({ message: "Bạn không thể tự hạ quyền tài khoản quản trị đang đăng nhập." });
    }
    user.role = body.role;
    changed = true;
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return response.status(400).json({ message: "Trạng thái tài khoản không hợp lệ." });
    }
    if (isSelf && body.status === "locked") {
      return response.status(409).json({ message: "Bạn không thể tự khóa tài khoản đang đăng nhập." });
    }
    user.status = body.status;
    changed = true;
  }

  if (!changed) {
    return response.status(400).json({ message: "Không có thông tin nào cần cập nhật." });
  }

  // Không để hệ thống mất quản trị viên đang hoạt động cuối cùng.
  const wasActiveAdmin = before.role === "admin" && before.status !== "locked";
  const stillActiveAdmin = user.role === "admin" && user.status !== "locked";
  if (wasActiveAdmin && !stillActiveAdmin && (await countOtherActiveAdmins(user._id)) === 0) {
    return response.status(409).json({
      message: "Hệ thống cần ít nhất một quản trị viên đang hoạt động. Hãy cấp quyền cho tài khoản khác trước."
    });
  }

  try {
    await user.save();
  } catch (error) {
    if (error?.code === 11000) {
      return response.status(409).json({ message: "Email này đã được sử dụng cho tài khoản khác." });
    }
    throw error;
  }

  response.json({ user: serializeUser(user) });
}

export async function adminDeleteUser(request, response) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    return response.status(400).json({ message: "Mã người dùng không hợp lệ." });
  }
  if (request.user?.sub === id) {
    return response.status(409).json({ message: "Bạn không thể xóa tài khoản đang đăng nhập." });
  }

  const user = await User.findById(id);
  if (!user) {
    return response.status(404).json({ message: "Không tìm thấy người dùng cần xóa." });
  }

  if (user.role === "admin" && user.status !== "locked" && (await countOtherActiveAdmins(user._id)) === 0) {
    return response.status(409).json({ message: "Không thể xóa quản trị viên đang hoạt động cuối cùng." });
  }

  // Xóa kèm dữ liệu học tập của tài khoản để không để lại bản ghi mồ côi.
  await Promise.all([
    Attempt.deleteMany({ userId: user._id }),
    Progress.deleteMany({ userId: user._id }),
    Ranking.deleteOne({ userId: user._id }),
    User.deleteOne({ _id: user._id })
  ]);

  response.json({ message: "Đã xóa tài khoản người dùng." });
}
