import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Attempt from "../Models/Attempt.js";
import Category from "../Models/Category.js";
import Package from "../Models/Package.js";
import Question from "../Models/Question.js";
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

const DAY_MS = 24 * 60 * 60 * 1000;
const REPORT_TIMEZONE = process.env.REPORT_TIMEZONE || "Asia/Ho_Chi_Minh";
const DISTRIBUTION_COLORS = ["#4c6ef5", "#10b981", "#8b5cf6", "#f5a524", "#ec4899", "#0ea5e9"];
const WEEKDAY_LABELS = {
  Sun: "CN",
  Mon: "Thứ 2",
  Tue: "Thứ 3",
  Wed: "Thứ 4",
  Thu: "Thứ 5",
  Fri: "Thứ 6",
  Sat: "Thứ 7"
};

// Múi giờ báo cáo dùng chung khi gom nhóm theo ngày để không lệch ngày do máy chủ chạy UTC.
function dateKey(value) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date(value));
}

function weekdayLabel(value) {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: REPORT_TIMEZONE, weekday: "short" }).format(new Date(value));
  return WEEKDAY_LABELS[weekday] || weekday;
}

function dateLabel(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: REPORT_TIMEZONE, day: "2-digit", month: "2-digit"
  }).format(new Date(value));
}

function buildBuckets(days) {
  const now = Date.now();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now - (days - 1 - index) * DAY_MS);
    return { date, key: dateKey(date) };
  });
}

function buildGrowthSeries(buckets, attemptMap, userMap) {
  const attempts = buckets.map(({ key }) => attemptMap.get(key) || 0);
  const users = buckets.map(({ key }) => userMap.get(key) || 0);
  const labels = buckets.length <= 7
    ? buckets.map(({ date }) => weekdayLabel(date))
    : buckets
      .filter((_, index) => index % 5 === 0 || index === buckets.length - 1)
      .map(({ date }) => dateLabel(date));
  return {
    labels,
    attempts,
    users,
    peak: attempts.length ? Math.max(...attempts) : 0
  };
}

function timeAgo(value) {
  const elapsed = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(elapsed / 60000));
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: REPORT_TIMEZONE, day: "2-digit", month: "2-digit", year: "numeric"
  }).format(new Date(value));
}

function countByKey(rows, key) {
  return rows.find((row) => row._id === key)?.count || 0;
}

function sumCounts(rows) {
  return rows.reduce((total, row) => total + row.count, 0);
}

// Toàn bộ số liệu trang Tổng quan được tính trực tiếp từ MongoDB, không dùng dữ liệu mẫu.
export async function adminOverview(_request, response) {
  const since7 = new Date(Date.now() - 7 * DAY_MS);
  const since30 = new Date(Date.now() - 30 * DAY_MS);

  const [
    userRoleRows,
    packageStatusRows,
    questionSetStatusRows,
    questionTotal,
    categoryTotal,
    attemptStats,
    newUsers7d,
    attemptGrowthRows,
    userGrowthRows
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Package.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    QuestionSet.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Question.countDocuments({}),
    Category.countDocuments({}),
    Attempt.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          avgAccuracy: { $avg: { $cond: [{ $eq: ["$status", "completed"] }, "$accuracy", null] } }
        }
      }
    ]),
    User.countDocuments({ role: "student", createdAt: { $gte: since7 } }),
    Attempt.aggregate([
      { $match: { status: "completed", createdAt: { $gte: since30 } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: REPORT_TIMEZONE } },
          count: { $sum: 1 }
        }
      }
    ]),
    User.aggregate([
      { $match: { role: "student", createdAt: { $gte: since30 } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: REPORT_TIMEZONE } },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const [
    categories,
    packageCategoryRows,
    allQuestionSets,
    questionCountRows,
    latestPackages,
    latestUsers,
    latestAttempts
  ] = await Promise.all([
    Category.find({}).select("name").sort({ name: 1 }).lean(),
    Package.find({}).select("categoryId").lean(),
    QuestionSet.find({}).select("packageId").lean(),
    Question.aggregate([{ $group: { _id: "$questionSetId", count: { $sum: 1 } } }]),
    Package.find({})
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(5)
      .populate("categoryId", "name")
      .lean(),
    User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name fullName email role status createdAt")
      .lean(),
    Attempt.find({ status: "completed" })
      .sort({ completedAt: -1, createdAt: -1 })
      .limit(5)
      .select("studentName score totalQuestions accuracy completedAt createdAt")
      .lean()
  ]);

  // Phân bổ số câu hỏi theo chủ đề: questionSet -> package -> category.
  const categoryNames = new Map(categories.map((category) => [category._id.toString(), category.name]));
  const packageCategory = new Map(packageCategoryRows.map((item) => [
    item._id.toString(),
    item.categoryId ? item.categoryId.toString() : "uncategorized"
  ]));
  const setPackage = new Map(allQuestionSets.map((item) => [item._id.toString(), item.packageId?.toString()]));
  const setQuestionCount = new Map(questionCountRows.map((row) => [row._id.toString(), row.count]));
  const questionsByCategory = new Map();

  for (const questionSet of allQuestionSets) {
    const packageId = setPackage.get(questionSet._id.toString());
    const categoryKey = (packageId && packageCategory.get(packageId)) || "uncategorized";
    const count = setQuestionCount.get(questionSet._id.toString()) || 0;
    questionsByCategory.set(categoryKey, (questionsByCategory.get(categoryKey) || 0) + count);
  }

  const distribution = [...questionsByCategory.entries()]
    .filter(([, count]) => count > 0)
    .sort((left, right) => right[1] - left[1])
    .map(([categoryKey, count], index) => ({
      id: categoryKey,
      name: categoryNames.get(categoryKey) || "Chưa phân loại",
      count,
      percent: questionTotal ? Math.round((count / questionTotal) * 100) : 0,
      color: DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length]
    }));

  // Tỷ lệ đạt của mỗi gói = trung bình độ chính xác các lượt hoàn thành thuộc các bộ của gói.
  const latestPackageIds = latestPackages.map((item) => item._id);
  const latestSets = latestPackageIds.length
    ? await QuestionSet.find({ packageId: { $in: latestPackageIds } }).select("packageId").lean()
    : [];
  const latestSetIds = latestSets.map((item) => item._id);
  const [latestQuestionRows, latestAccuracyRows] = latestSetIds.length
    ? await Promise.all([
      Question.aggregate([
        { $match: { questionSetId: { $in: latestSetIds } } },
        { $group: { _id: "$questionSetId", count: { $sum: 1 } } }
      ]),
      Attempt.aggregate([
        { $match: { status: "completed", questionSetId: { $in: latestSetIds } } },
        { $group: { _id: "$questionSetId", accuracy: { $avg: "$accuracy" } } }
      ])
    ])
    : [[], []];

  const latestQuestionCount = new Map(latestQuestionRows.map((row) => [row._id.toString(), row.count]));
  const latestAccuracy = new Map(latestAccuracyRows.map((row) => [row._id.toString(), row.accuracy]));

  const latestPackageRows = latestPackages.map((item) => {
    const sets = latestSets.filter((questionSet) => questionSet.packageId?.toString() === item._id.toString());
    const setIds = sets.map((questionSet) => questionSet._id.toString());
    const questionCount = setIds.reduce((total, id) => total + (latestQuestionCount.get(id) || 0), 0);
    const accuracies = setIds
      .map((id) => latestAccuracy.get(id))
      .filter((value) => Number.isFinite(value));
    return {
      id: item._id.toString(),
      name: item.name,
      category: item.categoryId?.name || "Chưa phân loại",
      status: item.status,
      setCount: sets.length,
      questionCount,
      passRate: accuracies.length
        ? Math.round(accuracies.reduce((total, value) => total + value, 0) / accuracies.length)
        : null,
      updatedAt: item.updatedAt || item.createdAt
    };
  });

  // Nhật ký hoạt động dựng từ sự kiện thật: tài khoản mới, lượt làm bài hoàn thành, gói vừa cập nhật.
  const activityFeed = [
    ...latestUsers.map((user) => ({
      at: user.createdAt,
      type: "user",
      tone: "blue",
      before: "Tài khoản mới ",
      highlight: user.name || user.fullName || user.email,
      after: user.role === "admin" ? " được cấp quyền quản trị" : " vừa đăng ký",
      metaSuffix: "Người dùng"
    })),
    ...latestAttempts.map((attempt) => ({
      at: attempt.completedAt || attempt.createdAt,
      type: "attempt",
      tone: "amber",
      before: "Học viên ",
      highlight: attempt.studentName || "Học sinh",
      after: ` hoàn thành ${attempt.score}/${attempt.totalQuestions} câu (${attempt.accuracy}%)`,
      metaSuffix: "Lượt làm bài"
    })),
    ...latestPackages.map((learningPackage) => ({
      at: learningPackage.updatedAt || learningPackage.createdAt,
      type: "package",
      tone: "green",
      before: "Gói câu hỏi ",
      highlight: learningPackage.name,
      after: " vừa được cập nhật",
      metaSuffix: "Nội dung học tập"
    }))
  ]
    .filter((item) => item.at)
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
    .slice(0, 6)
    .map((item, index) => ({
      id: `${item.type}-${index}-${new Date(item.at).getTime()}`,
      type: item.type,
      tone: item.tone,
      before: item.before,
      highlight: item.highlight,
      after: item.after,
      meta: `${timeAgo(item.at)} • ${item.metaSuffix}`
    }));

  const attemptTotals = attemptStats[0] || {};
  const students = countByKey(userRoleRows, "student");
  const admins = countByKey(userRoleRows, "admin");
  const attemptMap = new Map(attemptGrowthRows.map((row) => [row._id, row.count]));
  const userMap = new Map(userGrowthRows.map((row) => [row._id, row.count]));

  response.json({
    generatedAt: new Date().toISOString(),
    totals: {
      users: students + admins,
      students,
      admins,
      newUsers7d,
      packages: sumCounts(packageStatusRows),
      activePackages: countByKey(packageStatusRows, "active"),
      questionSets: sumCounts(questionSetStatusRows),
      activeQuestionSets: countByKey(questionSetStatusRows, "active"),
      questions: questionTotal,
      categories: categoryTotal,
      attempts: attemptTotals.total || 0,
      completedAttempts: attemptTotals.completed || 0,
      avgAccuracy: Math.round(attemptTotals.avgAccuracy || 0)
    },
    growth: {
      "7d": buildGrowthSeries(buildBuckets(7), attemptMap, userMap),
      "30d": buildGrowthSeries(buildBuckets(30), attemptMap, userMap)
    },
    distribution,
    latestPackages: latestPackageRows,
    activities: activityFeed,
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

