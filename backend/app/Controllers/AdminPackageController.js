// backend/app/Controllers/AdminPackageController.js
// Quản trị gói câu hỏi: đọc/ghi trực tiếp collection `packages`, không dùng dữ liệu mẫu.
// Số bộ đề / số câu hỏi của mỗi gói được đếm thật từ `questionSets` và `questions`.
import mongoose from "mongoose";
import Attempt from "../Models/Attempt.js";
import Category from "../Models/Category.js";
import Package from "../Models/Package.js";
import Question from "../Models/Question.js";
import QuestionSet from "../Models/QuestionSet.js";

const STATUSES = ["draft", "active", "inactive"];
const DIFFICULTIES = ["easy", "medium", "hard"];
const SORT_ORDERS = ["newest", "oldest", "mostSets", "mostXp", "name"];

function round1(value) {
  return Math.round(value * 10) / 10;
}

function normalizeDifficulty(value) {
  return DIFFICULTIES.includes(value) ? value : "medium";
}

function serializePackage(row, { categoryName = "", setCount = 0, questionCount = 0 } = {}) {
  return {
    id: row._id.toString(),
    name: row.name,
    description: row.description || "",
    image: row.image || "",
    difficulty: normalizeDifficulty(row.difficulty),
    order: Number.isFinite(row.order) ? row.order : 0,
    totalScore: Number.isFinite(row.totalScore) ? row.totalScore : 0,
    estimatedTime: Number.isFinite(row.estimatedTime) ? row.estimatedTime : 0,
    status: STATUSES.includes(row.status) ? row.status : "active",
    categoryId: row.categoryId ? row.categoryId.toString() : null,
    categoryName,
    setCount,
    questionCount,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || row.createdAt || null
  };
}

function validatePayload(body, { partial = false } = {}) {
  const result = {};

  if (!partial || body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      return { error: "Tên gói câu hỏi cần có ít nhất 2 ký tự." };
    }
    if (body.name.trim().length > 120) {
      return { error: "Tên gói câu hỏi không được vượt quá 120 ký tự." };
    }
    result.name = body.name.trim();
  }

  if (body.categoryId !== undefined) {
    if (body.categoryId === null || body.categoryId === "") {
      result.categoryId = null;
    } else if (typeof body.categoryId !== "string" || !mongoose.isValidObjectId(body.categoryId)) {
      return { error: "Chủ đề được chọn không hợp lệ." };
    } else {
      result.categoryId = body.categoryId;
    }
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      return { error: "Mô tả gói câu hỏi không hợp lệ." };
    }
    if (body.description.trim().length > 2000) {
      return { error: "Mô tả gói câu hỏi không được vượt quá 2000 ký tự." };
    }
    result.description = body.description.trim();
  }

  if (body.image !== undefined) {
    if (typeof body.image !== "string") {
      return { error: "Đường dẫn ảnh đại diện không hợp lệ." };
    }
    result.image = body.image.trim();
  }

  if (body.difficulty !== undefined) {
    if (!DIFFICULTIES.includes(body.difficulty)) {
      return { error: "Độ khó chỉ nhận giá trị easy, medium hoặc hard." };
    }
    result.difficulty = body.difficulty;
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return { error: "Trạng thái gói chỉ nhận giá trị draft, active hoặc inactive." };
    }
    result.status = body.status;
  }

  for (const field of ["order", "totalScore", "estimatedTime"]) {
    if (body[field] === undefined) continue;
    const number = Number(body[field]);
    if (!Number.isFinite(number) || number < 0) {
      return { error: "Giá trị số của gói câu hỏi không hợp lệ." };
    }
    result[field] = Math.round(number);
  }

  return { value: result };
}

async function assertCategoryExists(categoryId) {
  if (!categoryId) return { ok: true };
  const exists = await Category.exists({ _id: categoryId });
  return exists ? { ok: true } : { ok: false, message: "Không tìm thấy chủ đề đã chọn." };
}

// Gom số bộ đề / số câu hỏi theo gói: questions -> questionSets -> packages.
async function loadPackageMetrics() {
  const [packages, categories, questionSetRows, questionCountRows, attemptRows] = await Promise.all([
    Package.find({}).lean(),
    Category.find({}).select("name").lean(),
    QuestionSet.find({}).select("packageId").lean(),
    Question.aggregate([{ $group: { _id: "$questionSetId", count: { $sum: 1 } } }]),
    Attempt.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
  ]);

  const categoryNames = new Map(categories.map((item) => [item._id.toString(), item.name]));
  const questionCountBySet = new Map(questionCountRows.map((row) => [row._id.toString(), row.count]));

  const setCountByPackage = new Map();
  const questionCountByPackage = new Map();
  for (const questionSet of questionSetRows) {
    const packageKey = questionSet.packageId ? questionSet.packageId.toString() : null;
    if (!packageKey) continue;
    setCountByPackage.set(packageKey, (setCountByPackage.get(packageKey) || 0) + 1);
    const count = questionCountBySet.get(questionSet._id.toString()) || 0;
    questionCountByPackage.set(packageKey, (questionCountByPackage.get(packageKey) || 0) + count);
  }

  const rows = packages.map((item) => {
    const key = item._id.toString();
    return serializePackage(item, {
      categoryName: item.categoryId ? (categoryNames.get(item.categoryId.toString()) || "Chủ đề đã xóa") : "",
      setCount: setCountByPackage.get(key) || 0,
      questionCount: questionCountByPackage.get(key) || 0
    });
  });

  const statusCounts = { active: 0, draft: 0, inactive: 0 };
  for (const row of rows) statusCounts[row.status] += 1;

  const totalXp = rows.reduce((total, row) => total + row.totalScore, 0);
  const packagesWithSets = rows.filter((row) => row.setCount > 0).length;
  const totalAttempts = attemptRows.reduce((total, row) => total + row.count, 0);
  const completedAttempts = attemptRows.find((row) => row._id === "completed")?.count || 0;

  return {
    rows,
    stats: {
      total: rows.length,
      active: statusCounts.active,
      draft: statusCounts.draft,
      inactive: statusCounts.inactive,
      openRatio: rows.length ? round1((statusCounts.active / rows.length) * 100) : 0,
      totalSets: questionSetRows.length,
      packagesWithSets,
      setCoverage: rows.length ? Math.round((packagesWithSets / rows.length) * 100) : 0,
      totalQuestions: rows.reduce((total, row) => total + row.questionCount, 0),
      totalXp,
      averageXp: rows.length ? Math.round(totalXp / rows.length) : 0,
      totalAttempts,
      completedAttempts,
      completionRate: totalAttempts ? round1((completedAttempts / totalAttempts) * 100) : 0
    }
  };
}

export async function adminPackages(request, response) {
  const search = typeof request.query.q === "string" ? request.query.q.trim().toLowerCase() : "";
  const status = request.query.status;
  const difficulty = request.query.difficulty;
  const categoryId = request.query.categoryId;
  const sort = SORT_ORDERS.includes(request.query.sort) ? request.query.sort : "newest";
  const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(request.query.limit, 10) || 10));

  const { rows, stats } = await loadPackageMetrics();

  let filtered = rows;
  if (search) {
    filtered = filtered.filter((row) => row.name.toLowerCase().includes(search)
      || row.description.toLowerCase().includes(search)
      || row.categoryName.toLowerCase().includes(search));
  }
  if (STATUSES.includes(status)) {
    filtered = filtered.filter((row) => row.status === status);
  }
  if (DIFFICULTIES.includes(difficulty)) {
    filtered = filtered.filter((row) => row.difficulty === difficulty);
  }
  if (typeof categoryId === "string" && mongoose.isValidObjectId(categoryId)) {
    filtered = filtered.filter((row) => row.categoryId === categoryId);
  } else if (categoryId === "none") {
    filtered = filtered.filter((row) => !row.categoryId);
  }

  const timestamp = (value) => (value ? new Date(value).getTime() : 0);
  const sorted = [...filtered].sort((left, right) => {
    if (sort === "oldest") return timestamp(left.createdAt) - timestamp(right.createdAt);
    if (sort === "mostSets") return right.setCount - left.setCount || left.name.localeCompare(right.name, "vi");
    if (sort === "mostXp") return right.totalScore - left.totalScore || left.name.localeCompare(right.name, "vi");
    if (sort === "name") return left.name.localeCompare(right.name, "vi");
    return timestamp(right.createdAt) - timestamp(left.createdAt);
  });

  const total = sorted.length;
  const start = (page - 1) * limit;

  response.json({
    generatedAt: new Date().toISOString(),
    stats,
    items: sorted.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  });
}

export async function adminCreatePackage(request, response) {
  const { error, value } = validatePayload(request.body || {});
  if (error) return response.status(400).json({ message: error });

  const categoryCheck = await assertCategoryExists(value.categoryId);
  if (!categoryCheck.ok) return response.status(400).json({ message: categoryCheck.message });

  if (await Package.exists({ name: value.name })) {
    return response.status(409).json({ message: "Tên gói câu hỏi này đã tồn tại." });
  }

  const created = await Package.create({
    name: value.name,
    categoryId: value.categoryId || null,
    description: value.description || "",
    image: value.image || "",
    difficulty: value.difficulty || "medium",
    order: value.order || 0,
    totalScore: value.totalScore || 0,
    estimatedTime: value.estimatedTime || 0,
    status: value.status || "draft"
  });

  const category = created.categoryId
    ? await Category.findById(created.categoryId).select("name").lean()
    : null;
  response.status(201).json({
    package: serializePackage(created, { categoryName: category?.name || "" })
  });
}

export async function adminUpdatePackage(request, response) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    return response.status(400).json({ message: "Mã gói câu hỏi không hợp lệ." });
  }

  const learningPackage = await Package.findById(id);
  if (!learningPackage) {
    return response.status(404).json({ message: "Không tìm thấy gói câu hỏi cần cập nhật." });
  }

  const { error, value } = validatePayload(request.body || {}, { partial: true });
  if (error) return response.status(400).json({ message: error });

  if (value.categoryId !== undefined) {
    const categoryCheck = await assertCategoryExists(value.categoryId);
    if (!categoryCheck.ok) return response.status(400).json({ message: categoryCheck.message });
  }

  if (value.name !== undefined && value.name !== learningPackage.name) {
    if (await Package.exists({ name: value.name, _id: { $ne: learningPackage._id } })) {
      return response.status(409).json({ message: "Tên gói câu hỏi này đã tồn tại." });
    }
    learningPackage.name = value.name;
  }
  if (value.categoryId !== undefined) learningPackage.categoryId = value.categoryId;
  if (value.description !== undefined) learningPackage.description = value.description;
  if (value.image !== undefined) learningPackage.image = value.image;
  if (value.difficulty !== undefined) learningPackage.difficulty = value.difficulty;
  if (value.order !== undefined) learningPackage.order = value.order;
  if (value.totalScore !== undefined) learningPackage.totalScore = value.totalScore;
  if (value.estimatedTime !== undefined) learningPackage.estimatedTime = value.estimatedTime;
  if (value.status !== undefined) learningPackage.status = value.status;

  await learningPackage.save();

  const [category, setCount, questionSetIds] = await Promise.all([
    learningPackage.categoryId
      ? Category.findById(learningPackage.categoryId).select("name").lean()
      : null,
    QuestionSet.countDocuments({ packageId: learningPackage._id }),
    QuestionSet.find({ packageId: learningPackage._id }).select("_id").lean()
  ]);
  const questionCount = questionSetIds.length
    ? await Question.countDocuments({ questionSetId: { $in: questionSetIds.map((item) => item._id) } })
    : 0;

  response.json({
    package: serializePackage(learningPackage, {
      categoryName: category?.name || "",
      setCount,
      questionCount
    })
  });
}

export async function adminDeletePackage(request, response) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    return response.status(400).json({ message: "Mã gói câu hỏi không hợp lệ." });
  }

  const learningPackage = await Package.findById(id);
  if (!learningPackage) {
    return response.status(404).json({ message: "Không tìm thấy gói câu hỏi cần xóa." });
  }

  const setCount = await QuestionSet.countDocuments({ packageId: learningPackage._id });
  if (setCount > 0) {
    return response.status(409).json({
      message: `Gói đang chứa ${setCount} bộ câu hỏi — hãy xóa hoặc chuyển các bộ đề sang gói khác trước khi xóa.`
    });
  }

  await Package.deleteOne({ _id: learningPackage._id });
  response.json({ message: "Đã xóa gói câu hỏi." });
}
