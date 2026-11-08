// backend/app/Controllers/AdminQuestionSetController.js
// Quản trị bộ câu hỏi (chặng): đọc/ghi trực tiếp collection `questionSets`, không dùng dữ liệu mẫu.
// Số câu hỏi, số lượt làm bài và độ chính xác của từng bộ được tính thật từ `questions` và `attempts`.
import mongoose from "mongoose";
import Attempt from "../Models/Attempt.js";
import Package from "../Models/Package.js";
import Progress from "../Models/Progress.js";
import Question from "../Models/Question.js";
import QuestionSet from "../Models/QuestionSet.js";

const STATUSES = ["draft", "active", "inactive", "locked"];
const DIFFICULTIES = ["easy", "medium", "hard"];
const UNLOCK_TYPES = ["open", "complete_previous_set"];
const SORT_ORDERS = ["order", "newest", "oldest", "mostQuestions", "hardest", "name"];
const DIFFICULTY_RANK = { easy: 1, medium: 2, hard: 3 };
// Học viên đạt từ 80% số câu được tính là "vượt qua" bộ câu hỏi.
const PASS_THRESHOLD = 80;

function round1(value) {
  return Math.round(value * 10) / 10;
}

function normalizeDifficulty(value) {
  return DIFFICULTIES.includes(value) ? value : "medium";
}

function normalizeStatus(value) {
  return STATUSES.includes(value) ? value : "active";
}

function normalizeUnlockType(unlockCondition) {
  const type = unlockCondition && typeof unlockCondition === "object" ? unlockCondition.type : null;
  return UNLOCK_TYPES.includes(type) ? type : "open";
}

function buildUnlockCondition(unlockType) {
  return unlockType === "complete_previous_set" ? { type: "complete_previous_set" } : null;
}

function serializeQuestionSet(row, {
  packageName = "",
  categoryName = "",
  questionCount = 0,
  attemptCount = 0,
  averageAccuracy = 0
} = {}) {
  const order = Number.isFinite(row.order) ? row.order : (Number.isFinite(row.sequenceOrder) ? row.sequenceOrder : 0);
  return {
    id: row._id.toString(),
    packageId: row.packageId ? row.packageId.toString() : null,
    packageName,
    categoryName,
    name: row.name,
    description: row.description || "",
    order,
    difficulty: normalizeDifficulty(row.difficulty),
    score: Number.isFinite(row.score) ? row.score : 0,
    timeLimit: Number.isFinite(row.timeLimit) ? row.timeLimit : 0,
    status: normalizeStatus(row.status),
    unlockType: normalizeUnlockType(row.unlockCondition),
    questionCount,
    attemptCount,
    averageAccuracy: round1(averageAccuracy),
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || row.createdAt || null
  };
}

function validatePayload(body, { partial = false } = {}) {
  const result = {};

  if (!partial || body.packageId !== undefined) {
    if (typeof body.packageId !== "string" || !mongoose.isValidObjectId(body.packageId)) {
      return { error: "Hãy chọn gói câu hỏi (gói cha) cho bộ này." };
    }
    result.packageId = body.packageId;
  }

  if (!partial || body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      return { error: "Tên bộ câu hỏi cần có ít nhất 2 ký tự." };
    }
    if (body.name.trim().length > 120) {
      return { error: "Tên bộ câu hỏi không được vượt quá 120 ký tự." };
    }
    result.name = body.name.trim();
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      return { error: "Mô tả bộ câu hỏi không hợp lệ." };
    }
    if (body.description.trim().length > 2000) {
      return { error: "Mô tả bộ câu hỏi không được vượt quá 2000 ký tự." };
    }
    result.description = body.description.trim();
  }

  if (body.difficulty !== undefined) {
    if (!DIFFICULTIES.includes(body.difficulty)) {
      return { error: "Độ khó chỉ nhận giá trị easy, medium hoặc hard." };
    }
    result.difficulty = body.difficulty;
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return { error: "Trạng thái bộ chỉ nhận giá trị draft, active, inactive hoặc locked." };
    }
    result.status = body.status;
  }

  if (body.unlockType !== undefined) {
    if (!UNLOCK_TYPES.includes(body.unlockType)) {
      return { error: "Điều kiện mở khóa chỉ nhận giá trị open hoặc complete_previous_set." };
    }
    result.unlockType = body.unlockType;
  }

  for (const field of ["order", "score", "timeLimit"]) {
    if (body[field] === undefined) continue;
    const number = Number(body[field]);
    if (!Number.isFinite(number) || number < 0) {
      return { error: "Giá trị số của bộ câu hỏi không hợp lệ." };
    }
    result[field] = Math.round(number);
  }

  return { value: result };
}


async function loadQuestionSetRows() {
  const [questionSets, packages, questionCountRows, attemptRows] = await Promise.all([
    QuestionSet.find({}).lean(),
    Package.find({}).select("name categoryId").populate("categoryId", "name").lean(),
    Question.aggregate([{ $group: { _id: "$questionSetId", count: { $sum: 1 } } }]),
    Attempt.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$questionSetId",
          count: { $sum: 1 },
          accuracy: { $avg: "$accuracy" },
          passed: { $sum: { $cond: [{ $gte: ["$accuracy", PASS_THRESHOLD] }, 1, 0] } }
        }
      }
    ])
  ]);

  const packageInfo = new Map(packages.map((item) => [
    item._id.toString(),
    { name: item.name, categoryName: item.categoryId?.name || "" }
  ]));
  const questionCountBySet = new Map(questionCountRows.map((row) => [row._id.toString(), row.count]));
  const attemptInfoBySet = new Map(attemptRows.map((row) => [
    row._id.toString(),
    { count: row.count, accuracy: row.accuracy, passed: row.passed }
  ]));

  const rows = questionSets.map((row) => {
    const key = row._id.toString();
    const packageKey = row.packageId ? row.packageId.toString() : null;
    const packageMeta = packageKey ? packageInfo.get(packageKey) : null;
    const attemptInfo = attemptInfoBySet.get(key);
    return serializeQuestionSet(row, {
      packageName: packageMeta ? packageMeta.name : (packageKey ? "Gói đã xóa" : "Chưa gán gói"),
      categoryName: packageMeta ? packageMeta.categoryName : "",
      questionCount: questionCountBySet.get(key) || 0,
      attemptCount: attemptInfo?.count || 0,
      averageAccuracy: attemptInfo?.accuracy || 0
    });
  });

  const statusCounts = { active: 0, draft: 0, inactive: 0, locked: 0 };
  let questionTotal = 0;
  let setsWithQuestions = 0;
  let sequentialSets = 0;
  let attemptTotal = 0;
  let passedTotal = 0;
  let accuracyWeighted = 0;

  for (const row of rows) {
    statusCounts[row.status] += 1;
    questionTotal += row.questionCount;
    if (row.questionCount > 0) setsWithQuestions += 1;
    if (row.unlockType === "complete_previous_set") sequentialSets += 1;
    const attemptInfo = attemptInfoBySet.get(row.id);
    if (attemptInfo) {
      attemptTotal += attemptInfo.count;
      passedTotal += attemptInfo.passed;
      accuracyWeighted += attemptInfo.accuracy * attemptInfo.count;
    }
  }

  const total = rows.length;
  return {
    rows,
    stats: {
      total,
      active: statusCounts.active,
      draft: statusCounts.draft,
      inactive: statusCounts.inactive,
      locked: statusCounts.locked,
      openRatio: total ? round1((statusCounts.active / total) * 100) : 0,
      totalQuestions: questionTotal,
      averageQuestions: total ? round1(questionTotal / total) : 0,
      setsWithQuestions,
      questionCoverage: total ? Math.round((setsWithQuestions / total) * 100) : 0,
      sequentialSets,
      sequentialRatio: total ? round1((sequentialSets / total) * 100) : 0,
      totalAttempts: attemptTotal,
      passedAttempts: passedTotal,
      averageAccuracy: attemptTotal ? round1(accuracyWeighted / attemptTotal) : 0,
      passRate: attemptTotal ? round1((passedTotal / attemptTotal) * 100) : 0,
      passThreshold: PASS_THRESHOLD
    }
  };
}

export async function adminQuestionSets(request, response) {
  const search = typeof request.query.q === "string" ? request.query.q.trim().toLowerCase() : "";
  const status = request.query.status;
  const difficulty = request.query.difficulty;
  const packageId = request.query.packageId;
  const sort = SORT_ORDERS.includes(request.query.sort) ? request.query.sort : "order";
  const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(request.query.limit, 10) || 10));

  const { rows, stats } = await loadQuestionSetRows();

  let filtered = rows;
  if (search) {
    filtered = filtered.filter((row) => row.name.toLowerCase().includes(search)
      || row.description.toLowerCase().includes(search)
      || row.packageName.toLowerCase().includes(search));
  }
  if (STATUSES.includes(status)) {
    filtered = filtered.filter((row) => row.status === status);
  }
  if (DIFFICULTIES.includes(difficulty)) {
    filtered = filtered.filter((row) => row.difficulty === difficulty);
  }
  if (typeof packageId === "string" && mongoose.isValidObjectId(packageId)) {
    filtered = filtered.filter((row) => row.packageId === packageId);
  } else if (packageId === "none") {
    filtered = filtered.filter((row) => !row.packageId);
  }

  const timestamp = (value) => (value ? new Date(value).getTime() : 0);
  const sorted = [...filtered].sort((left, right) => {
    if (sort === "newest") return timestamp(right.updatedAt) - timestamp(left.updatedAt);
    if (sort === "oldest") return timestamp(left.createdAt) - timestamp(right.createdAt);
    if (sort === "mostQuestions") return right.questionCount - left.questionCount
      || left.packageName.localeCompare(right.packageName, "vi")
      || left.order - right.order;
    if (sort === "hardest") return (DIFFICULTY_RANK[right.difficulty] || 0) - (DIFFICULTY_RANK[left.difficulty] || 0)
      || left.packageName.localeCompare(right.packageName, "vi")
      || left.order - right.order;
    if (sort === "name") return left.name.localeCompare(right.name, "vi");
    return left.packageName.localeCompare(right.packageName, "vi")
      || left.order - right.order
      || left.name.localeCompare(right.name, "vi");
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


async function loadQuestionSetRow(id) {
  const row = await QuestionSet.findById(id).lean();
  if (!row) return null;

  const [learningPackage, questionCount, attemptRows] = await Promise.all([
    row.packageId
      ? Package.findById(row.packageId).select("name categoryId").populate("categoryId", "name").lean()
      : null,
    Question.countDocuments({ questionSetId: row._id }),
    Attempt.aggregate([
      { $match: { questionSetId: row._id, status: "completed" } },
      { $group: { _id: null, count: { $sum: 1 }, accuracy: { $avg: "$accuracy" } } }
    ])
  ]);

  return serializeQuestionSet(row, {
    packageName: learningPackage ? learningPackage.name : (row.packageId ? "Gói đã xóa" : "Chưa gán gói"),
    categoryName: learningPackage?.categoryId?.name || "",
    questionCount,
    attemptCount: attemptRows[0]?.count || 0,
    averageAccuracy: attemptRows[0]?.accuracy || 0
  });
}

async function assertPackageExists(packageId) {
  const exists = await Package.exists({ _id: packageId });
  return exists ? { ok: true } : { ok: false, message: "Không tìm thấy gói câu hỏi (gói cha) đã chọn." };
}

// Tên bộ câu hỏi không được trùng trong cùng một gói.
async function assertNameAvailable({ name, packageId, excludeId = null }) {
  const filter = { packageId, name };
  if (excludeId) filter._id = { $ne: excludeId };
  const exists = await QuestionSet.exists(filter);
  return exists ? { ok: false } : { ok: true };
}

export async function adminCreateQuestionSet(request, response) {
  const { error, value } = validatePayload(request.body || {});
  if (error) return response.status(400).json({ message: error });

  const packageCheck = await assertPackageExists(value.packageId);
  if (!packageCheck.ok) return response.status(400).json({ message: packageCheck.message });

  const nameCheck = await assertNameAvailable({ name: value.name, packageId: value.packageId });
  if (!nameCheck.ok) {
    return response.status(409).json({ message: "Gói này đã có bộ câu hỏi cùng tên." });
  }

  const created = await QuestionSet.create({
    packageId: value.packageId,
    name: value.name,
    description: value.description || "",
    order: value.order ?? 0,
    sequenceOrder: value.order ?? 0,
    difficulty: value.difficulty || "medium",
    score: value.score ?? 0,
    timeLimit: value.timeLimit ?? 0,
    unlockCondition: buildUnlockCondition(value.unlockType || "open"),
    status: value.status || "draft"
  });

  const row = await loadQuestionSetRow(created._id);
  response.status(201).json({ questionSet: row });
}


export async function adminUpdateQuestionSet(request, response) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    return response.status(400).json({ message: "Mã bộ câu hỏi không hợp lệ." });
  }

  const questionSet = await QuestionSet.findById(id);
  if (!questionSet) {
    return response.status(404).json({ message: "Không tìm thấy bộ câu hỏi cần cập nhật." });
  }

  const { error, value } = validatePayload(request.body || {}, { partial: true });
  if (error) return response.status(400).json({ message: error });

  if (value.packageId !== undefined) {
    const packageCheck = await assertPackageExists(value.packageId);
    if (!packageCheck.ok) return response.status(400).json({ message: packageCheck.message });
  }

  // Đổi tên hoặc chuyển gói đều phải kiểm tra trùng tên trong gói đích.
  const targetPackageId = value.packageId !== undefined
    ? value.packageId
    : (questionSet.packageId ? questionSet.packageId.toString() : null);
  const targetName = value.name !== undefined ? value.name : questionSet.name;
  if (value.name !== undefined || value.packageId !== undefined) {
    const nameCheck = await assertNameAvailable({
      name: targetName,
      packageId: targetPackageId,
      excludeId: questionSet._id
    });
    if (!nameCheck.ok) {
      return response.status(409).json({ message: "Gói này đã có bộ câu hỏi cùng tên." });
    }
  }

  if (value.packageId !== undefined) questionSet.packageId = value.packageId;
  if (value.name !== undefined) questionSet.name = value.name;
  if (value.description !== undefined) questionSet.description = value.description;
  if (value.difficulty !== undefined) questionSet.difficulty = value.difficulty;
  if (value.status !== undefined) questionSet.status = value.status;
  if (value.unlockType !== undefined) questionSet.unlockCondition = buildUnlockCondition(value.unlockType);
  if (value.order !== undefined) {
    questionSet.order = value.order;
    questionSet.sequenceOrder = value.order;
  }
  if (value.score !== undefined) questionSet.score = value.score;
  if (value.timeLimit !== undefined) questionSet.timeLimit = value.timeLimit;

  await questionSet.save();

  const row = await loadQuestionSetRow(questionSet._id);
  response.json({ questionSet: row });
}

export async function adminDeleteQuestionSet(request, response) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    return response.status(400).json({ message: "Mã bộ câu hỏi không hợp lệ." });
  }

  const questionSet = await QuestionSet.findById(id);
  if (!questionSet) {
    return response.status(404).json({ message: "Không tìm thấy bộ câu hỏi cần xóa." });
  }

  // Giữ lịch sử học tập: bộ đã có lượt làm bài thì không cho xóa.
  const attemptCount = await Attempt.countDocuments({ questionSetId: questionSet._id });
  if (attemptCount > 0) {
    return response.status(409).json({
      message: `Bộ câu hỏi đã có ${attemptCount} lượt làm bài của học viên — hãy chuyển sang trạng thái “Tạm khóa” thay vì xóa để giữ lịch sử.`
    });
  }

  const [questionResult] = await Promise.all([
    Question.deleteMany({ questionSetId: questionSet._id }),
    QuestionSet.deleteOne({ _id: questionSet._id })
  ]);

  // Dọn tham chiếu trong tiến độ học tập để không còn chặng “mồ côi”.
  await Progress.updateMany(
    { $or: [{ completedSets: questionSet._id }, { unlockedSets: questionSet._id }] },
    { $pull: { completedSets: questionSet._id, unlockedSets: questionSet._id } }
  );
  await Progress.updateMany(
    { $or: [{ currentSetId: questionSet._id }, { currentSet: questionSet._id }] },
    { $unset: { currentSetId: "", currentSet: "" } }
  );

  response.json({
    message: "Đã xóa bộ câu hỏi.",
    deletedQuestions: questionResult.deletedCount || 0
  });
}

