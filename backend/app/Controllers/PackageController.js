import Attempt from "../Models/Attempt.js";
import Package from "../Models/Package.js";
import Question from "../Models/Question.js";
import QuestionSet from "../Models/QuestionSet.js";
import Topic from "../Models/Topic.js";

async function getQuestionCounts(questionSets) {
  if (!questionSets.length) return new Map();
  const counts = await Question.aggregate([
    { $match: { questionSetId: { $in: questionSets.map(({ _id }) => _id) } } },
    { $group: { _id: "$questionSetId", count: { $sum: 1 } } }
  ]);
  return new Map(counts.map(({ _id, count }) => [_id.toString(), count]));
}

async function getCompletedSetIds(userId, questionSets) {
  if (!questionSets.length) return new Set();
  const attempts = await Attempt.find({
    $or: [{ user: userId }, { userId }],
    status: "completed",
    questionSetId: { $in: questionSets.map(({ _id }) => _id) }
  }).select("questionSetId").lean();
  return new Set(attempts.map(({ questionSetId }) => questionSetId.toString()));
}

export async function listPackages(request, response) {
  const packages = await Package.find({ status: "active" })
    .populate("categoryId", "name")
    .sort({ createdAt: -1, _id: 1 })
    .lean();
  const packageIds = packages.map(({ _id }) => _id);
  const questionSets = await QuestionSet.find({ packageId: { $in: packageIds }, status: "active" })
    .sort({ order: 1, _id: 1 })
    .lean();
  const [questionCounts, completedSetIds] = await Promise.all([
    getQuestionCounts(questionSets),
    getCompletedSetIds(request.user.sub, questionSets)
  ]);
  const setsByPackage = new Map();

  for (const questionSet of questionSets) {
    const sets = setsByPackage.get(questionSet.packageId.toString()) || [];
    const questionCount = questionCounts.get(questionSet._id.toString()) || 0;
    sets.push({
      ...questionSet,
      questionCount,
      completed: completedSetIds.has(questionSet._id.toString())
    });
    setsByPackage.set(questionSet.packageId.toString(), sets);
  }

  response.json(packages.map((learningPackage) => {
    const questionSetsForPackage = setsByPackage.get(learningPackage._id.toString()) || [];
    return {
      ...learningPackage,
      category: learningPackage.categoryId?.name || "Lịch sử Việt Nam",
      questionSets: questionSetsForPackage,
      questionSetCount: questionSetsForPackage.length,
      questionCount: questionSetsForPackage.reduce((total, questionSet) => total + questionSet.questionCount, 0)
    };
  }));
}

export async function getPackageDetails(request, response) {
  const learningPackage = await Package.findOne({ _id: request.params.packageId, status: "active" })
    .populate("categoryId", "name")
    .lean();
  if (!learningPackage) return response.status(404).json({ message: "Không tìm thấy gói câu hỏi." });

  const questionSets = await QuestionSet.find({ packageId: learningPackage._id, status: "active" })
    .sort({ order: 1, _id: 1 })
    .lean();
  const [questionCounts, completedSetIds] = await Promise.all([
    getQuestionCounts(questionSets),
    getCompletedSetIds(request.user.sub, questionSets)
  ]);
  const nextSetIndex = questionSets.findIndex((questionSet) => !completedSetIds.has(questionSet._id.toString()));
  const sets = questionSets.map((questionSet, index) => ({
    ...questionSet,
    questionCount: questionCounts.get(questionSet._id.toString()) || 0,
    completed: completedSetIds.has(questionSet._id.toString()),
    unlocked: completedSetIds.has(questionSet._id.toString()) || index === nextSetIndex
  }));

  response.json({
    ...learningPackage,
    category: learningPackage.categoryId?.name || "Lịch sử Việt Nam",
    questionSets: sets,
    questionSetCount: sets.length,
    questionCount: sets.reduce((total, questionSet) => total + questionSet.questionCount, 0)
  });
}

export async function getQuestionSetQuiz(request, response) {
  const questionSet = await QuestionSet.findOne({ _id: request.params.questionSetId, status: "active" }).lean();
  if (!questionSet) return response.status(404).json({ message: "Không tìm thấy bộ câu hỏi." });

  const learningPackage = await Package.findOne({ _id: questionSet.packageId, status: "active" })
    .populate("categoryId", "name")
    .lean();
  if (!learningPackage) return response.status(404).json({ message: "Không tìm thấy gói câu hỏi." });

  const orderedSets = await QuestionSet.find({ packageId: learningPackage._id, status: "active" })
    .select("_id")
    .sort({ order: 1, _id: 1 })
    .lean();
  const selectedIndex = orderedSets.findIndex((item) => item._id.toString() === questionSet._id.toString());
  if (selectedIndex > 0) {
    const completedSetIds = await getCompletedSetIds(request.user.sub, orderedSets.slice(0, selectedIndex));
    if (orderedSets.slice(0, selectedIndex).some((item) => !completedSetIds.has(item._id.toString()))) {
      return response.status(403).json({ message: "Hãy hoàn thành chặng trước để mở khóa bộ câu hỏi này." });
    }
  }

  const questions = await Question.find({ questionSetId: questionSet._id })
    .select("prompt options order explanation")
    .sort({ order: 1, _id: 1 })
    .lean();

  response.json({
    topic: {
      _id: learningPackage._id,
      title: questionSet.name,
      period: learningPackage.categoryId?.name || "Lịch sử Việt Nam",
      summary: questionSet.description || learningPackage.description
    },
    questionSet: { _id: questionSet._id, name: questionSet.name },
    questions
  });
}

export async function submitQuestionSetAttempt(request, response) {
  const { questionSetId, answers } = request.body;
  if (!Array.isArray(answers) || !answers.length) {
    return response.status(400).json({ message: "Hãy chọn đáp án trước khi nộp bài." });
  }

  const questionSet = await QuestionSet.findOne({ _id: questionSetId, status: "active" }).lean();
  if (!questionSet) return response.status(404).json({ message: "Không tìm thấy bộ câu hỏi." });

  const learningPackage = await Package.findOne({ _id: questionSet.packageId, status: "active" }).lean();
  if (!learningPackage) return response.status(404).json({ message: "Không tìm thấy gói câu hỏi." });

  const orderedSets = await QuestionSet.find({ packageId: learningPackage._id, status: "active" })
    .select("_id")
    .sort({ order: 1, _id: 1 })
    .lean();
  const selectedIndex = orderedSets.findIndex((item) => item._id.toString() === questionSet._id.toString());
  if (selectedIndex > 0) {
    const completedSetIds = await getCompletedSetIds(request.user.sub, orderedSets.slice(0, selectedIndex));
    if (orderedSets.slice(0, selectedIndex).some((item) => !completedSetIds.has(item._id.toString()))) {
      return response.status(403).json({ message: "Hãy hoàn thành chặng trước để mở khóa bộ câu hỏi này." });
    }
  }

  const questions = await Question.find({ questionSetId: questionSet._id }).sort({ order: 1, _id: 1 }).lean();
  const submitted = new Map(answers.map((answer) => [String(answer.questionId), answer.selectedIndex]));
  if (!questions.length || submitted.size !== questions.length || questions.some((question) => !submitted.has(String(question._id)))) {
    return response.status(400).json({ message: "Bài làm chưa có đủ câu trả lời hợp lệ." });
  }

  for (const question of questions) {
    const selectedIndex = submitted.get(String(question._id));
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= question.options.length) {
      return response.status(400).json({ message: "Đáp án gửi lên không hợp lệ." });
    }
  }

  const score = questions.reduce((total, question) => (
    total + Number(submitted.get(String(question._id)) === question.answerIndex)
  ), 0);
  const topic = await Topic.findById(learningPackage._id).select("_id").lean();
  const attempt = await Attempt.create({
    user: request.user.sub,
    studentName: request.user.name,
    ...(topic ? { topic: topic._id } : {}),
    questionSetId: questionSet._id,
    answers: questions.map((question) => ({
      question: question._id,
      selectedIndex: submitted.get(String(question._id))
    })),
    score,
    totalQuestions: questions.length
  });

  response.status(201).json({
    attemptId: attempt._id,
    score,
    totalQuestions: questions.length,
    review: questions.map((question) => ({
      prompt: question.prompt,
      options: question.options,
      selectedIndex: submitted.get(String(question._id)),
      answerIndex: question.answerIndex,
      explanation: question.explanation
    }))
  });
}
