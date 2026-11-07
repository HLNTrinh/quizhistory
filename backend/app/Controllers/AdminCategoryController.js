// backend/app/Controllers/AdminCategoryController.js
// Quản trị chủ đề / thời kỳ lịch sử: danh sách kèm số gói & số câu hỏi thật từ MongoDB.
// Các thao tác ghi kiểm tra trùng tên và chặn xóa chủ đề còn chứa gói câu hỏi.
import mongoose from "mongoose";
import Category from "../Models/Category.js";
import Package from "../Models/Package.js";
import Question from "../Models/Question.js";
import QuestionSet from "../Models/QuestionSet.js";

const STATUSES = ["active", "inactive"];
const SORT_ORDERS = ["newest", "oldest", "mostPackages", "mostQuestions"];

function serializeCategory(category, packageCount = 0, questionCount = 0) {
  return {
    id: category._id.toString(),
    name: category.name,
    description: category.description || "",
    image: category.image || "",
    status: category.status === "inactive" ? "inactive" : "active",
    packageCount,
    questionCount,
    createdAt: category.createdAt || null,
    updatedAt: category.updatedAt || category.createdAt || null
  };
}

function validatePayload(body, { partial = false } = {}) {
  const result = {};

  if (!partial || body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      return { error: "Tên chủ đề cần có ít nhất 2 ký tự." };
    }
    if (body.name.trim().length > 120) {
      return { error: "Tên chủ đề không được vượt quá 120 ký tự." };
    }
    result.name = body.name.trim();
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      return { error: "Mô tả chủ đề không hợp lệ." };
    }
    if (body.description.trim().length > 2000) {
      return { error: "Mô tả chủ đề không được vượt quá 2000 ký tự." };
    }
    result.description = body.description.trim();
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return { error: "Trạng thái chủ đề không hợp lệ." };
    }
    result.status = body.status;
  }

  return { value: result };
}

// Gom số gói và số câu hỏi theo chủ đề: question -> questionSet -> package -> category.
async function loadCategoryMetrics() {
  const [categories, packages, questionSetRows, questionCountRows] = await Promise.all([
    Category.find({}).lean(),
    Package.find({}).select("categoryId").lean(),
    QuestionSet.find({}).select("packageId").lean(),
    Question.aggregate([{ $group: { _id: "$questionSetId", count: { $sum: 1 } } }])
  ]);

  const packageCategory = new Map(
    packages.map((item) => [item._id.toString(), item.categoryId ? item.categoryId.toString() : null])
  );

  const packageCounts = new Map();
  for (const item of packages) {
    const categoryKey = item.categoryId ? item.categoryId.toString() : null;
    if (!categoryKey) continue;
    packageCounts.set(categoryKey, (packageCounts.get(categoryKey) || 0) + 1);
  }

  const questionCountBySet = new Map(questionCountRows.map((row) => [row._id.toString(), row.count]));
  const questionCounts = new Map();
  for (const questionSet of questionSetRows) {
    const categoryKey = packageCategory.get(questionSet.packageId?.toString());
    if (!categoryKey) continue;
    const count = questionCountBySet.get(questionSet._id.toString()) || 0;
    questionCounts.set(categoryKey, (questionCounts.get(categoryKey) || 0) + count);
  }

  const rows = categories.map((category) => {
    const key = category._id.toString();
    return serializeCategory(category, packageCounts.get(key) || 0, questionCounts.get(key) || 0);
  });

  const active = rows.filter((row) => row.status === "active").length;
  const assignedPackages = rows.reduce((total, row) => total + row.packageCount, 0);

  return {
    rows,
    stats: {
      total: rows.length,
      active,
      inactive: rows.length - active,
      openRatio: rows.length ? Math.round((active / rows.length) * 1000) / 10 : 0,
      packages: packages.length,
      assignedPackages,
      unassignedPackages: Math.max(0, packages.length - assignedPackages),
      questions: rows.reduce((total, row) => total + row.questionCount, 0),
      categoriesWithQuestions: rows.filter((row) => row.questionCount > 0).length
    }
  };
}

export async function adminCategories(request, response) {
  const search = typeof request.query.q === "string" ? request.query.q.trim() : "";
  const status = request.query.status;
  const sort = SORT_ORDERS.includes(request.query.sort) ? request.query.sort : "newest";
  const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(request.query.limit, 10) || 10));

  const { rows, stats } = await loadCategoryMetrics();

  let filtered = rows;
  if (search) {
    const keyword = search.toLowerCase();
    filtered = filtered.filter((row) => row.name.toLowerCase().includes(keyword)
      || row.description.toLowerCase().includes(keyword));
  }
  if (STATUSES.includes(status)) {
    filtered = filtered.filter((row) => row.status === status);
  }

  const timestamp = (value) => (value ? new Date(value).getTime() : 0);
  const sorted = [...filtered].sort((left, right) => {
    if (sort === "oldest") return timestamp(left.createdAt) - timestamp(right.createdAt);
    if (sort === "mostPackages") return right.packageCount - left.packageCount || left.name.localeCompare(right.name, "vi");
    if (sort === "mostQuestions") return right.questionCount - left.questionCount || left.name.localeCompare(right.name, "vi");
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

export async function adminCreateCategory(request, response) {
  const { error, value } = validatePayload(request.body || {});
  if (error) return response.status(400).json({ message: error });

  const name = value.name;
  if (await Category.exists({ name })) {
    return response.status(409).json({ message: "Tên chủ đề này đã tồn tại." });
  }

  try {
    const category = await Category.create({
      name,
      description: value.description || "",
      status: value.status || "active"
    });
    response.status(201).json({ category: serializeCategory(category) });
  } catch (error2) {
    if (error2?.code === 11000) {
      return response.status(409).json({ message: "Tên chủ đề này đã tồn tại." });
    }
    throw error2;
  }
}

export async function adminUpdateCategory(request, response) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    return response.status(400).json({ message: "Mã chủ đề không hợp lệ." });
  }

  const category = await Category.findById(id);
  if (!category) {
    return response.status(404).json({ message: "Không tìm thấy chủ đề cần cập nhật." });
  }

  const { error, value } = validatePayload(request.body || {}, { partial: true });
  if (error) return response.status(400).json({ message: error });

  if (value.name !== undefined && value.name !== category.name) {
    if (await Category.exists({ name: value.name, _id: { $ne: category._id } })) {
      return response.status(409).json({ message: "Tên chủ đề này đã tồn tại." });
    }
    category.name = value.name;
  }
  if (value.description !== undefined) category.description = value.description;
  if (value.status !== undefined) category.status = value.status;

  try {
    await category.save();
  } catch (error2) {
    if (error2?.code === 11000) {
      return response.status(409).json({ message: "Tên chủ đề này đã tồn tại." });
    }
    throw error2;
  }

  const packageCount = await Package.countDocuments({ categoryId: category._id });
  response.json({ category: serializeCategory(category, packageCount) });
}

export async function adminDeleteCategory(request, response) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) {
    return response.status(400).json({ message: "Mã chủ đề không hợp lệ." });
  }

  const category = await Category.findById(id);
  if (!category) {
    return response.status(404).json({ message: "Không tìm thấy chủ đề cần xóa." });
  }

  const packageCount = await Package.countDocuments({ categoryId: category._id });
  if (packageCount > 0) {
    return response.status(409).json({
      message: `Chủ đề đang chứa ${packageCount} gói câu hỏi — hãy chuyển các gói sang chủ đề khác trước khi xóa.`
    });
  }

  await Category.deleteOne({ _id: category._id });
  response.json({ message: "Đã xóa chủ đề." });
}
