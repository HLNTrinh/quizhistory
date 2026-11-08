// backend/app/Controllers/AdminQuestionController.js
// Quản trị ngân hàng câu hỏi: đọc/ghi trực tiếp collection `questions`, không dùng dữ liệu mẫu.
// Tên bộ đề / gói câu hỏi / chủ đề được ghép từ `questionSets` → `packages` → `categories`.
import mongoose from "mongoose";
import Attempt from "../Models/Attempt.js";
import Category from "../Models/Category.js";
import Package from "../Models/Package.js";
import Question from "../Models/Question.js";
import QuestionSet from "../Models/QuestionSet.js";

const DIFFICULTIES = ["easy", "medium", "hard"];
const DIFFICULTY_RANK = { easy: 1, medium: 2, hard: 3 };
const SORT_ORDERS = ["order", "newest", "oldest", "difficulty", "score"];
const EXPLANATION_FILTERS = ["all", "has", "missing"];
const ANSWER_LETTERS = ["A", "B", "C", "D"];
const OPTION_COUNT = 4;
const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 10;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function normalizeDifficulty(value) {
  return DIFFICULTIES.includes(value) ? value : "medium";
}

function hasExplanation(row) {
  return typeof row.explanation === "string" && row.explanation.trim().length > 0;
}

function resolveAnswerIndex(row, options) {
  if (Number.isInteger(row.answerIndex) && row.answerIndex >= 0 && row.answerIndex < options.length) {
    return row.answerIndex;
  }
  if (Number.isInteger(row.correctAnswer) && row.correctAnswer >= 0 && row.correctAnswer < options.length) {
    return row.correctAnswer;
  }
  if (typeof row.correctAnswer === "string") {
    const index = options.indexOf(row.correctAnswer);
    if (index !== -1) return index;
  }
  return 0;
}

function questionCode(id) {
  return `#Q-${String(id).slice(-6).toUpperCase()}`;
}

function serializeQuestion(row, maps = {}) {
  const options = Array.isArray(row.options) ? row.options : [];
  const answerIndex = resolveAnswerIndex(row, options);
  const setId = row.questionSetId ? String(row.questionSetId) : null;
  const set = setId ? maps.sets?.get(setId) : null;
  const packageId = set?.packageId ? String(set.packageId) : null;
  const pkg = packageId ? maps.packages?.get(packageId) : null;
  const categoryId = pkg?.categoryId ? String(pkg.categoryId) : null;
  const category = categoryId ? maps.categories?.get(categoryId) : null;
  const order = Number.isFinite(row.order) ? row.order : (Number.isFinite(row.sequenceOrder) ? row.sequenceOrder : 0);

  return {
    id: String(row._id),
    code: questionCode(row._id),
    content: row.content || row.prompt || "",
    options,
    answerIndex,
    answerLetter: ANSWER_LETTERS[answerIndex] || "A",
    answerText: options[answerIndex] || "",
    explanation: row.explanation || "",
    hasExplanation: hasExplanation(row),
    difficulty: normalizeDifficulty(row.difficulty),
    score: Number.isFinite(row.score) ? row.score : 0,
    order,
    questionSetId: setId,
    questionSetName: set?.name || "",
    packageId,
    packageName: pkg?.name || "",
    categoryName: category?.name || "",
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || row.createdAt || null
  };
}

// Nạp tên bộ đề / gói / chủ đề cho một trang câu hỏi (3 truy vấn song song).
async function loadRelationMaps(rows) {
  const setIds = [...new Set(rows.map((row) => (row.questionSetId ? String(row.questionSetId) : null)).filter(Boolean))];
  const sets = setIds.length
    ? await QuestionSet.find({ _id: { $in: setIds } }).select("name packageId").lean()
    : [];
  const setMap = new Map(sets.map((row) => [String(row._id), row]));

  const packageIds = [...new Set(sets.map((row) => (row.packageId ? String(row.packageId) : null)).filter(Boolean))];
  const packages = packageIds.length
    ? await Package.find({ _id: { $in: packageIds } }).select("name categoryId").lean()
    : [];
  const packageMap = new Map(packages.map((row) => [String(row._id), row]));

  const categoryIds = [...new Set(packages.map((row) => (row.categoryId ? String(row.categoryId) : null)).filter(Boolean))];
  const categories = categoryIds.length
    ? await Category.find({ _id: { $in: categoryIds } }).select("name").lean()
    : [];

  return {
    sets: setMap,
    packages: packageMap,
    categories: new Map(categories.map((row) => [String(row._id), row]))
  };
}


// Dựng điều kiện lọc; trả về mảng điều kiện để ghép bằng $and (tránh xung đột $or).
async function buildConditions({ q, difficulty, questionSetId, packageId, categoryId, explanation }) {
  const conditions = [];

  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    conditions.push({ $or: [{ content: pattern }, { prompt: pattern }] });
  }

  if (DIFFICULTIES.includes(difficulty)) conditions.push({ difficulty });

  if (explanation === "has") {
    // Chỉ tính là "có giải thích" khi nội dung có ký tự thực (khớp với stats.explanationRatio).
    conditions.push({ explanation: { $regex: /\S/ } });
  } else if (explanation === "missing") {
    conditions.push({ $or: [{ explanation: { $exists: false } }, { explanation: null }, { explanation: "" }] });
  }

  if (questionSetId === "none") {
    conditions.push({ $or: [{ questionSetId: { $exists: false } }, { questionSetId: null }] });
  } else if (questionSetId && mongoose.isValidObjectId(questionSetId)) {
    // aggregate() không tự cast string sang ObjectId như find() nên phải đổi tường minh.
    conditions.push({ questionSetId: new mongoose.Types.ObjectId(questionSetId) });
  }

  if (packageId && mongoose.isValidObjectId(packageId)) {
    const setIds = await QuestionSet.find({ packageId }).distinct("_id");
    conditions.push({ questionSetId: { $in: setIds } });
  }

  if (categoryId && mongoose.isValidObjectId(categoryId)) {
    const packageIds = await Package.find({ categoryId }).distinct("_id");
    const setIds = await QuestionSet.find({ packageId: { $in: packageIds } }).distinct("_id");
    conditions.push({ questionSetId: { $in: setIds } });
  }

  return conditions;
}

function combineConditions(conditions) {
  if (!conditions.length) return {};
  if (conditions.length === 1) return conditions[0];
  return { $and: conditions };
}

function buildSort(sort) {
  switch (sort) {
    case "newest":
      return { updatedAt: -1, _id: -1 };
    case "oldest":
      return { createdAt: 1, _id: 1 };
    case "difficulty":
      return { difficultyRank: -1, sequenceOrder: 1, _id: 1 };
    case "score":
      return { score: -1, _id: 1 };
    case "order":
    default:
      return { sequenceOrder: 1, order: 1, _id: 1 };
  }
}

async function computeStats() {
  const [difficultyRows, totals, coveredSetIds] = await Promise.all([
    Question.aggregate([{ $group: { _id: "$difficulty", count: { $sum: 1 } } }]),
    Question.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          averageScore: { $avg: "$score" },
          withExplanation: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: [{ $type: "$explanation" }, "string"] },
                    { $ne: [{ $trim: { input: { $ifNull: ["$explanation", ""] } } }, ""] }
                  ]
                },
                1,
                0
              ]
            }
          },
          unattached: {
            $sum: { $cond: [{ $eq: [{ $type: "$questionSetId" }, "missing"] }, 1, 0] }
          }
        }
      }
    ]),
    Question.distinct("questionSetId")
  ]);

  const total = totals[0]?.total || 0;
  const withExplanation = totals[0]?.withExplanation || 0;
  const byDifficulty = { easy: 0, medium: 0, hard: 0 };
  for (const row of difficultyRows) {
    byDifficulty[normalizeDifficulty(row._id)] += row.count || 0;
  }

  const coveredSets = coveredSetIds.filter(Boolean).length;
  const [totalSets, updated7d] = await Promise.all([
    QuestionSet.countDocuments({}),
    Question.countDocuments({ updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
  ]);

  return {
    total,
    easy: byDifficulty.easy,
    medium: byDifficulty.medium,
    hard: byDifficulty.hard,
    withExplanation,
    missingExplanation: Math.max(0, total - withExplanation),
    explanationRatio: total ? round1((withExplanation / total) * 100) : 0,
    averageScore: round1(totals[0]?.averageScore || 0),
    coveredSets,
    totalSets,
    setCoverage: totalSets ? round1((coveredSets / totalSets) * 100) : 0,
    unattached: totals[0]?.unattached || 0,
    updated7d
  };
}

export async function adminQuestions(request, response) {
  const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(request.query.limit, 10) || DEFAULT_PAGE_SIZE));
  const sort = SORT_ORDERS.includes(request.query.sort) ? request.query.sort : "order";
  const explanation = EXPLANATION_FILTERS.includes(request.query.explanation) ? request.query.explanation : "all";
  const q = typeof request.query.q === "string" ? request.query.q.trim().slice(0, 120) : "";

  try {
    const filter = combineConditions(await buildConditions({
      q,
      difficulty: request.query.difficulty,
      questionSetId: request.query.questionSetId,
      packageId: request.query.packageId,
      categoryId: request.query.categoryId,
      explanation
    }));

    const [total, stats] = await Promise.all([Question.countDocuments(filter), computeStats()]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);

    const rows = await Question.aggregate([
      { $match: filter },
      {
        $addFields: {
          difficultyRank: {
            $switch: {
              branches: [
                { case: { $eq: ["$difficulty", "easy"] }, then: DIFFICULTY_RANK.easy },
                { case: { $eq: ["$difficulty", "hard"] }, then: DIFFICULTY_RANK.hard }
              ],
              default: DIFFICULTY_RANK.medium
            }
          }
        }
      },
      { $sort: buildSort(sort) },
      { $skip: (safePage - 1) * limit },
      { $limit: limit }
    ]);

    const maps = await loadRelationMaps(rows);

    response.json({
      stats,
      items: rows.map((row) => serializeQuestion(row, maps)),
      pagination: { page: safePage, limit, total, totalPages }
    });
  } catch (error) {
    console.error("[admin] Lỗi tải ngân hàng câu hỏi:", error);
    response.status(500).json({ message: "Không tải được danh sách câu hỏi từ cơ sở dữ liệu." });
  }
}


function normalizeOptions(value) {
  if (!Array.isArray(value) || value.length !== OPTION_COUNT) return null;
  const options = value.map((item) => (typeof item === "string" ? item.trim() : ""));
  if (options.some((item) => !item.length || item.length > 500)) return null;
  if (new Set(options).size !== OPTION_COUNT) return null;
  return options;
}

function validatePayload(body, { partial = false } = {}) {
  const result = {};

  if (!partial || body.questionSetId !== undefined) {
    if (typeof body.questionSetId !== "string" || !mongoose.isValidObjectId(body.questionSetId)) {
      return { error: "Hãy chọn bộ đề cho câu hỏi này." };
    }
    result.questionSetId = body.questionSetId;
  }

  if (!partial || body.content !== undefined) {
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (content.length < 5) return { error: "Nội dung câu hỏi cần có ít nhất 5 ký tự." };
    if (content.length > 2000) return { error: "Nội dung câu hỏi không được vượt quá 2000 ký tự." };
    result.content = content;
  }

  if (!partial || body.options !== undefined) {
    const options = normalizeOptions(body.options);
    if (!options) {
      return { error: "Câu hỏi trắc nghiệm phải có đúng 4 đáp án A, B, C, D khác nhau và không được để trống." };
    }
    result.options = options;
  }

  if (!partial || body.answerIndex !== undefined) {
    const index = Number(body.answerIndex);
    if (!Number.isInteger(index) || index < 0 || index >= OPTION_COUNT) {
      return { error: "Hãy chọn đáp án đúng (A, B, C hoặc D)." };
    }
    result.answerIndex = index;
  }

  if (body.explanation !== undefined) {
    if (typeof body.explanation !== "string") return { error: "Giải thích đáp án không hợp lệ." };
    if (body.explanation.trim().length > 2000) {
      return { error: "Giải thích đáp án không được vượt quá 2000 ký tự." };
    }
    result.explanation = body.explanation.trim();
  }

  if (body.difficulty !== undefined) {
    if (!DIFFICULTIES.includes(body.difficulty)) {
      return { error: "Độ khó phải là Cơ bản, Trung bình hoặc Nâng cao." };
    }
    result.difficulty = body.difficulty;
  }

  if (body.score !== undefined) {
    const score = Number(body.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return { error: "Điểm của câu hỏi phải nằm trong khoảng 0 – 100." };
    }
    result.score = score;
  }

  if (body.order !== undefined) {
    const order = Number(body.order);
    if (!Number.isFinite(order) || order < 0 || !Number.isInteger(order)) {
      return { error: "Thứ tự câu hỏi phải là số nguyên không âm." };
    }
    result.order = order;
  }

  return { value: result };
}

async function loadQuestionRow(id) {
  const row = await Question.findById(id).lean();
  if (!row) return null;
  const maps = await loadRelationMaps([row]);
  return serializeQuestion(row, maps);
}


export async function adminCreateQuestion(request, response) {
  const { error, value } = validatePayload(request.body || {});
  if (error) return response.status(400).json({ message: error });

  const questionSet = await QuestionSet.findById(value.questionSetId).select("_id").lean();
  if (!questionSet) {
    return response.status(400).json({ message: "Bộ đề đã chọn không tồn tại trong hệ thống." });
  }

  let order = value.order;
  if (order === undefined) {
    const lastQuestion = await Question.findOne({ questionSetId: questionSet._id })
      .sort({ order: -1, sequenceOrder: -1 })
      .select("order sequenceOrder")
      .lean();
    const lastOrder = Number.isFinite(lastQuestion?.order)
      ? lastQuestion.order
      : (Number.isFinite(lastQuestion?.sequenceOrder) ? lastQuestion.sequenceOrder : 0);
    order = lastQuestion ? lastOrder + 1 : 1;
  }

  const question = await Question.create({
    questionSetId: questionSet._id,
    content: value.content,
    prompt: value.content,
    options: value.options,
    answerIndex: value.answerIndex,
    correctAnswer: value.answerIndex,
    explanation: value.explanation || "",
    difficulty: value.difficulty || "medium",
    score: value.score === undefined ? 1 : value.score,
    order,
    sequenceOrder: order
  });

  response.status(201).json({ question: await loadQuestionRow(question._id) });
}

export async function adminUpdateQuestion(request, response) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    return response.status(400).json({ message: "Mã câu hỏi không hợp lệ." });
  }

  const question = await Question.findById(id);
  if (!question) {
    return response.status(404).json({ message: "Không tìm thấy câu hỏi cần cập nhật." });
  }

  const { error, value } = validatePayload(request.body || {}, { partial: true });
  if (error) return response.status(400).json({ message: error });

  if (value.questionSetId !== undefined) {
    const questionSet = await QuestionSet.findById(value.questionSetId).select("_id").lean();
    if (!questionSet) {
      return response.status(400).json({ message: "Bộ đề đã chọn không tồn tại trong hệ thống." });
    }
    question.questionSetId = value.questionSetId;
  }

  if (value.content !== undefined) {
    question.content = value.content;
    question.prompt = value.content;
  }
  if (value.options !== undefined) question.options = value.options;
  if (value.answerIndex !== undefined) {
    question.answerIndex = value.answerIndex;
    question.correctAnswer = value.answerIndex;
  }
  if (value.explanation !== undefined) question.explanation = value.explanation;
  if (value.difficulty !== undefined) question.difficulty = value.difficulty;
  if (value.score !== undefined) question.score = value.score;
  if (value.order !== undefined) {
    question.order = value.order;
    question.sequenceOrder = value.order;
  }

  await question.save();

  response.json({ question: await loadQuestionRow(question._id) });
}

export async function adminDeleteQuestion(request, response) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    return response.status(400).json({ message: "Mã câu hỏi không hợp lệ." });
  }

  const question = await Question.findById(id).select("_id").lean();
  if (!question) {
    return response.status(404).json({ message: "Không tìm thấy câu hỏi cần xóa." });
  }

  // Đếm số lượt làm bài có tham chiếu câu hỏi này để cảnh báo (không chặn xóa).
  const referencedAttempts = await Attempt.countDocuments({ "answers.question": question._id });
  await Question.deleteOne({ _id: question._id });

  response.json({
    message: "Đã xóa câu hỏi.",
    referencedAttempts
  });
}

