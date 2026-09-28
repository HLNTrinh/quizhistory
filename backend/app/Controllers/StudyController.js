import Attempt from "../Models/Attempt.js";
import Question from "../Models/Question.js";
import Topic from "../Models/Topic.js";

export async function getDashboard(request, response) {
  const userId = request.user.sub;
  const [topics, questionCount, topicCounts, attempts, recentAttempts] = await Promise.all([
    Topic.find().sort({ order: 1 }).lean(),
    Question.countDocuments(),
    Question.aggregate([
      { $group: { _id: "$topic", count: { $sum: 1 } } }
    ]),
    Attempt.find({ user: userId }).select("score totalQuestions").lean(),
    Attempt.find({ user: userId }).populate("topic", "title").sort({ createdAt: -1 }).limit(5).lean()
  ]);

  const countByTopic = new Map(topicCounts.map(({ _id, count }) => [_id.toString(), count]));
  const answered = attempts.reduce((total, attempt) => total + attempt.totalQuestions, 0);
  const correct = attempts.reduce((total, attempt) => total + attempt.score, 0);

  response.json({
    topics: topics.map((topic) => ({
      ...topic,
      questionCount: countByTopic.get(topic._id.toString()) || 0
    })),
    questionCount,
    attempts: attempts.length,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    recentAttempts
  });
}

export async function listTopics(_request, response) {
  const topics = await Topic.find().sort({ order: 1 }).lean();
  const counts = await Question.aggregate([
    { $group: { _id: "$topic", count: { $sum: 1 } } }
  ]);
  const countByTopic = new Map(counts.map(({ _id, count }) => [_id.toString(), count]));

  response.json(topics.map((topic) => ({
    ...topic,
    questionCount: countByTopic.get(topic._id.toString()) || 0
  })));
}

export async function getQuiz(request, response) {
  const topic = await Topic.findById(request.params.topicId).lean();
  if (!topic) return response.status(404).json({ message: "Không tìm thấy chủ đề." });

  const questions = await Question.find({ topic: topic._id })
    .select("prompt options order")
    .sort({ order: 1 })
    .lean();

  response.json({ topic, questions });
}

export async function submitAttempt(request, response) {
  const { topicId, answers } = request.body;
  if (!Array.isArray(answers) || !answers.length) {
    return response.status(400).json({ message: "Hãy chọn đáp án trước khi nộp bài." });
  }

  const topic = await Topic.findById(topicId);
  if (!topic) return response.status(404).json({ message: "Không tìm thấy chủ đề." });

  const questions = await Question.find({ topic: topic._id }).sort({ order: 1 }).lean();
  const submitted = new Map(answers.map((answer) => [String(answer.questionId), answer.selectedIndex]));
  if (submitted.size !== questions.length || questions.some((question) => !submitted.has(String(question._id)))) {
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
  const attempt = await Attempt.create({
    user: request.user.sub,
    studentName: request.user.name,
    topic: topic._id,
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