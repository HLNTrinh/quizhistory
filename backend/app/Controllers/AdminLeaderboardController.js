// backend/app/Controllers/AdminLeaderboardController.js
// Quản trị bảng xếp hạng người học: thống kê thật từ MongoDB, lọc, sắp xếp, phân trang và điều chỉnh XP.
import mongoose from "mongoose";
import Attempt from "../Models/Attempt.js";
import Package from "../Models/Package.js";
import Progress from "../Models/Progress.js";
import QuestionSet from "../Models/QuestionSet.js";
import Ranking from "../Models/Ranking.js";
import User from "../Models/User.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildInitials(name) {
  if (!name || typeof name !== "string") return "HV";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "HV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function timeAgo(date) {
  if (!date) return "Chưa có hoạt động";
  const elapsed = Date.now() - new Date(date).getTime();
  const minutes = Math.max(0, Math.floor(elapsed / 60000));
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hôm qua";
  if (days < 7) return `${days} ngày trước`;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(date));
}

function calculateTier(xp) {
  if (xp >= 1000) return "champion";
  if (xp >= 500) return "general";
  if (xp >= 100) return "pioneer";
  return "young";
}

export async function adminLeaderboard(request, response) {
  const search = typeof request.query.q === "string" ? request.query.q.trim() : "";
  const period = request.query.period || "all";
  const tier = request.query.tier || "all";
  const sort = request.query.sort || "xp-desc";
  const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(request.query.limit, 10) || 10));

  const since7 = new Date(Date.now() - 7 * DAY_MS);
  const since30 = new Date(Date.now() - 30 * DAY_MS);

  // 1. Lấy thông tin tổng thể khoá học (tổng gói & bộ đề active)
  const [totalPackages, totalQuestionSets, allStudents] = await Promise.all([
    Package.countDocuments({ status: "active" }),
    QuestionSet.countDocuments({ status: "active" }),
    User.find({ role: "student" }).select("fullName name email totalScore createdAt updatedAt status avatar").lean()
  ]);

  if (!allStudents.length) {
    return response.json({
      stats: {
        totalLearners: 0,
        activeThisWeek: 0,
        topScore: 0,
        topLearnerName: "Chưa có",
        averageScore: 0,
        avgPackagesCompleted: 0
      },
      items: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 1
      }
    });
  }

  const studentIds = allStudents.map((s) => s._id);

  // 2. Gom nhóm kết quả làm bài của học viên từ Attempts
  const [attemptAgg, recentWeekAgg, progressAgg] = await Promise.all([
    Attempt.aggregate([
      { $match: { userId: { $in: studentIds }, status: "completed" } },
      {
        $group: {
          _id: "$userId",
          totalScore: { $sum: "$score" },
          attempts: { $sum: 1 },
          avgAccuracy: { $avg: "$accuracy" },
          lastCompletedAt: { $max: { $ifNull: ["$completedAt", "$createdAt"] } },
          completedSetIds: { $addToSet: "$questionSetId" }
        }
      }
    ]),
    Attempt.aggregate([
      { $match: { userId: { $in: studentIds }, status: "completed", createdAt: { $gte: since7 } } },
      {
        $group: {
          _id: "$userId",
          weekScore: { $sum: "$score" }
        }
      }
    ]),
    Progress.aggregate([
      { $match: { userId: { $in: studentIds } } },
      {
        $group: {
          _id: "$userId",
          completedPackages: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          completedSetsCount: { $sum: "$completedSetsCount" }
        }
      }
    ])
  ]);

  const attemptMap = new Map(attemptAgg.map((row) => [row._id.toString(), row]));
  const weekMap = new Map(recentWeekAgg.map((row) => [row._id.toString(), row.weekScore]));
  const progressMap = new Map(progressAgg.map((row) => [row._id.toString(), row]));

  // 3. Chuẩn hoá dữ liệu từng học viên
  const fullList = allStudents.map((user) => {
    const userIdStr = user._id.toString();
    const attempt = attemptMap.get(userIdStr);
    const prog = progressMap.get(userIdStr);
    const weekScore = weekMap.get(userIdStr) || 0;

    const name = user.fullName || user.name || user.email.split("@")[0];
    const xp = Math.round(user.totalScore || attempt?.totalScore || 0);
    const accuracy = attempt ? Math.round((attempt.avgAccuracy || 0) * 10) / 10 : 0;
    const sets = prog?.completedSetsCount || (attempt?.completedSetIds ? attempt.completedSetIds.filter(Boolean).length : 0);
    const packages = prog?.completedPackages || 0;
    const progressPercent = totalQuestionSets > 0 ? Math.min(100, Math.round((sets / totalQuestionSets) * 100)) : 0;
    const lastActive = attempt?.lastCompletedAt || user.updatedAt || user.createdAt;
    const updatedMinutes = lastActive ? Math.max(0, Math.floor((Date.now() - new Date(lastActive).getTime()) / 60000)) : 999999;

    const delta = weekScore > 0 ? `+${weekScore} XP tuần này` : "0 XP tuần này";

    return {
      id: userIdStr,
      shortId: `HQ-${userIdStr.slice(-5).toUpperCase()}`,
      name,
      email: user.email,
      initials: buildInitials(name),
      tier: calculateTier(xp),
      xp,
      delta,
      packages,
      sets,
      progress: progressPercent,
      accuracy,
      updated: timeAgo(lastActive),
      updatedMinutes,
      lastActiveAt: lastActive
    };
  });

  // 4. Tính toán thống kê toàn khoá (stats)
  const totalLearners = fullList.length;
  const activeThisWeek = fullList.filter((item) => item.updatedMinutes <= 7 * 24 * 60).length;
  const sortedByXpAll = [...fullList].sort((a, b) => b.xp - a.xp);
  const top1 = sortedByXpAll[0];
  const topScore = top1 ? top1.xp : 0;
  const topLearnerName = top1 ? top1.name : "Chưa có";
  const totalXp = fullList.reduce((sum, item) => sum + item.xp, 0);
  const averageScore = totalLearners ? Math.round(totalXp / totalLearners) : 0;
  const totalPackagesDone = fullList.reduce((sum, item) => sum + item.packages, 0);
  const avgPackagesCompleted = totalLearners ? Math.round((totalPackagesDone / totalLearners) * 10) / 10 : 0;

  // 5. Lọc danh sách (Search, Period, Tier)
  let filtered = fullList;

  if (search) {
    const pattern = new RegExp(escapeRegExp(search), "i");
    filtered = filtered.filter((row) => pattern.test(row.name) || pattern.test(row.email) || pattern.test(row.id) || pattern.test(row.shortId));
  }

  if (tier !== "all") {
    filtered = filtered.filter((row) => row.tier === tier);
  }

  if (period === "week") {
    filtered = filtered.filter((row) => row.updatedMinutes <= 7 * 24 * 60);
  } else if (period === "month") {
    filtered = filtered.filter((row) => row.updatedMinutes <= 30 * 24 * 60);
  }

  // 6. Sắp xếp danh sách
  filtered.sort((a, b) => {
    if (sort === "xp-asc") return a.xp - b.xp;
    if (sort === "accuracy") return b.accuracy - a.accuracy;
    if (sort === "recent") return a.updatedMinutes - b.updatedMinutes;
    return b.xp - a.xp; // xp-desc
  });

  // 7. Phân trang
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  response.json({
    stats: {
      totalLearners,
      activeThisWeek,
      topScore,
      topLearnerName,
      averageScore,
      avgPackagesCompleted,
      totalPackages,
      totalQuestionSets
    },
    items: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  });
}

export async function adminAdjustLearnerXp(request, response) {
  const { id } = request.params;
  const { xp, delta } = request.body || {};

  const numericXp = Number(xp);
  if (!Number.isFinite(numericXp) || numericXp < 0) {
    return response.status(400).json({ message: "Điểm XP phải là một số không âm." });
  }

  if (!mongoose.isValidObjectId(id)) {
    return response.status(400).json({ message: "Mã học viên không hợp lệ." });
  }

  const user = await User.findById(id);
  if (!user) {
    return response.status(404).json({ message: "Không tìm thấy học viên." });
  }

  user.totalScore = numericXp;
  await user.save();

  await Ranking.findOneAndUpdate(
    { userId: user._id },
    { totalScore: numericXp, updatedAt: new Date() },
    { upsert: true }
  );

  response.json({
    message: `Đã cập nhật điểm XP của ${user.fullName || user.name} thành ${numericXp} XP.`,
    user: {
      id: user._id.toString(),
      xp: numericXp,
      delta: delta ? String(delta).trim() : ""
    }
  });
}
