import bcrypt from "bcryptjs";
import Attempt from "../Models/Attempt.js";
import Package from "../Models/Package.js";
import QuestionSet from "../Models/QuestionSet.js";
import Topic from "../Models/Topic.js";
import User from "../Models/User.js";
import { createToken, publicUser } from "./AuthController.js";

function isCompleted(attempt) {
  return attempt.status !== "abandoned" && attempt.status !== "in_progress";
}

export async function getProfile(request, response) {
  const userId = request.user.sub;
  const [user, attempts, packages, questionSets, topics] = await Promise.all([
    User.findById(userId).lean(),
    Attempt.find({ $or: [{ user: userId }, { userId }] }).sort({ createdAt: -1 }).lean(),
    Package.find({ status: "active" }).populate("categoryId", "name").sort({ createdAt: -1 }).lean(),
    QuestionSet.find({ status: "active" }).sort({ order: 1, _id: 1 }).lean(),
    Topic.find().select("title period").lean()
  ]);

  if (!user) return response.status(404).json({ message: "Không tìm thấy tài khoản." });

  const topicById = new Map(topics.map((topic) => [topic._id.toString(), topic]));
  const questionSetById = new Map(questionSets.map((questionSet) => [questionSet._id.toString(), questionSet]));
  const packageById = new Map(packages.map((learningPackage) => [learningPackage._id.toString(), learningPackage]));
  const completedAttempts = attempts.filter(isCompleted);
  const completedQuestionSetIds = new Set(
    completedAttempts
      .filter((attempt) => attempt.questionSetId)
      .map((attempt) => attempt.questionSetId.toString())
  );
  const answeredQuestions = completedAttempts.reduce((total, attempt) => total + attempt.totalQuestions, 0);
  const correctAnswers = completedAttempts.reduce((total, attempt) => total + attempt.score, 0);
  const packageProgress = packages.map((learningPackage) => {
    const sets = questionSets.filter((questionSet) => questionSet.packageId.toString() === learningPackage._id.toString());
    const completedSets = sets.filter((questionSet) => completedQuestionSetIds.has(questionSet._id.toString())).length;
    return {
      id: learningPackage._id,
      name: learningPackage.name,
      category: learningPackage.categoryId?.name || "Lịch sử Việt Nam",
      completedSets,
      totalSets: sets.length,
      percent: sets.length ? Math.round((completedSets / sets.length) * 100) : 0
    };
  }).filter(({ totalSets }) => totalSets > 0);
  const recentAttempts = attempts.slice(0, 8).map((attempt) => {
    const topic = attempt.topic ? topicById.get(attempt.topic.toString()) : null;
    const questionSet = attempt.questionSetId ? questionSetById.get(attempt.questionSetId.toString()) : null;
    const learningPackage = questionSet ? packageById.get(questionSet.packageId.toString()) : null;
    return {
      id: attempt._id,
      title: questionSet?.name || topic?.title || "Bài ôn tập lịch sử",
      period: learningPackage?.categoryId?.name || topic?.period || "Lịch sử Việt Nam",
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      completedAt: attempt.completedAt || attempt.createdAt,
      status: attempt.status || "completed"
    };
  });

  response.json({
    user: publicUser(user),
    createdAt: user.createdAt,
    stats: {
      totalScore: correctAnswers,
      completedQuizzes: completedAttempts.length,
      completedSets: completedQuestionSetIds.size,
      totalSets: questionSets.length,
      accuracy: answeredQuestions ? Math.round((correctAnswers / answeredQuestions) * 100) : 0,
      answeredQuestions
    },
    packageProgress,
    recentAttempts
  });
}

export async function updateProfile(request, response) {
  const { name } = request.body;
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
    return response.status(400).json({ message: "Họ tên phải có từ 2 đến 80 ký tự." });
  }

  const user = await User.findById(request.user.sub);
  if (!user) return response.status(404).json({ message: "Tài khoản không còn tồn tại." });
  user.name = name.trim();
  await user.save();

  response.json({ user: publicUser(user), token: createToken(user) });
}

export async function updatePassword(request, response) {
  const { currentPassword, newPassword } = request.body;
  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return response.status(400).json({ message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới." });
  }
  if (newPassword.length < 8 || newPassword.length > 128) {
    return response.status(400).json({ message: "Mật khẩu mới cần có từ 8 đến 128 ký tự." });
  }

  const user = await User.findById(request.user.sub).select("+passwordHash");
  if (!user) return response.status(404).json({ message: "Tài khoản không còn tồn tại." });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return response.status(400).json({ message: "Mật khẩu hiện tại chưa chính xác." });
  }
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  response.json({ message: "Đã cập nhật mật khẩu." });
}
