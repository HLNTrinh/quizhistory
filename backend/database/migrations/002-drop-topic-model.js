import mongoose from "mongoose";
import Attempt from "../../app/Models/Attempt.js";
import Package from "../../app/Models/Package.js";
import Question from "../../app/Models/Question.js";
import QuestionSet from "../../app/Models/QuestionSet.js";

/**
 * Migration 002 - loại bỏ mô hình Topic (thiết kế cũ) khỏi cơ sở dữ liệu.
 *
 * Thứ tự thực hiện bắt buộc:
 *  1. Quy đổi câu hỏi legacy (chỉ có "topic") sang questionSetId; nếu nội dung đã tồn tại
 *     trong bộ câu hỏi đích thì xóa bản trùng (dữ liệu do seeder cũ sinh ra 2 lần).
 *  2. Bổ sung questionSetId/userId cho Attempt legacy + sửa correctAnswers/wrongAnswers/accuracy.
 *  3. Chuẩn hóa trạng thái Attempt (attempt đã chấm điểm => "completed").
 *  4. Gỡ các trường topic/user cũ (dùng raw driver vì schema không còn khai báo) và đồng bộ index.
 *  5. Drop collection "topics".
 *
 * Script dùng raw driver nên không import Topic model => có thể xóa Topic.js an toàn.
 * Idempotent: chạy lại nhiều lần không gây lỗi, không còn topics thì chỉ kiểm tra lại dữ liệu.
 */
async function findTargetSet(topic) {
  const directSet = await QuestionSet.findOne({ packageId: topic._id }).sort({ order: 1, _id: 1 }).lean();
  if (directSet) return directSet;

  // Migration 001 cũ tạo Package mới nên _id không còn trùng Topic._id: khớp theo tên.
  const learningPackage = topic.title ? await Package.findOne({ name: topic.title }).lean() : null;
  if (!learningPackage) return null;
  return QuestionSet.findOne({ packageId: learningPackage._id }).sort({ order: 1, _id: 1 }).lean();
}

async function contentExistsInSet(questionSetId, content) {
  if (!content) return false;
  return Boolean(await Question.exists({
    questionSetId,
    $or: [{ content }, { prompt: content }]
  }));
}

export async function dropTopicModel() {
  const database = mongoose.connection.db;
  const topicCollection = database.collection("topics");
  const topics = await topicCollection.find({}).toArray();
  const stats = {
    topicsDropped: 0,
    questionsMapped: 0,
    questionsDeduplicated: 0,
    orphanQuestions: 0,
    attemptsNormalized: 0
  };

  // 1. Quy đổi câu hỏi legacy.
  for (const topic of topics) {
    const targetSet = await findTargetSet(topic);
    if (!targetSet) continue;

    const legacyQuestions = await Question.find({
      topic: topic._id,
      $or: [{ questionSetId: { $exists: false } }, { questionSetId: null }]
    }).lean();

    for (const legacyQuestion of legacyQuestions) {
      const content = (legacyQuestion.content || legacyQuestion.prompt || "").trim();
      if (await contentExistsInSet(targetSet._id, content)) {
        await Question.deleteOne({ _id: legacyQuestion._id });
        stats.questionsDeduplicated += 1;
        continue;
      }

      await Question.updateOne({ _id: legacyQuestion._id }, { $set: { questionSetId: targetSet._id } });
      stats.questionsMapped += 1;
    }
  }

  stats.topicsDropped = topics.length;

  // 2. Dọn câu hỏi mồ côi còn lại (không còn khả năng xác định bộ câu hỏi).
  const orphans = await Question.find({
    $or: [{ questionSetId: { $exists: false } }, { questionSetId: null }]
  }).lean();

  for (const orphan of orphans) {
    const content = (orphan.content || orphan.prompt || "").trim();
    const duplicate = content
      ? await Question.findOne({ questionSetId: { $ne: null }, $or: [{ content }, { prompt: content }] }).select("_id").lean()
      : null;

    if (duplicate) {
      await Question.deleteOne({ _id: orphan._id });
      stats.questionsDeduplicated += 1;
      continue;
    }

    // Giữ nguyên để quản trị viên rà soát thủ công, không xóa nội dung duy nhất.
    stats.orphanQuestions += 1;
  }

  // 3. Chuẩn hóa Attempt legacy.
  const legacyAttempts = await Attempt.find({
    $or: [
      { questionSetId: { $exists: false } },
      { questionSetId: null },
      { userId: { $exists: false } },
      { status: "in_progress" }
    ]
  }).lean();

  for (const attempt of legacyAttempts) {
    let questionSet = attempt.questionSetId
      ? await QuestionSet.findById(attempt.questionSetId).select("_id").lean()
      : null;
    if (!questionSet && attempt.topic) {
      questionSet = await QuestionSet.findOne({ packageId: attempt.topic }).select("_id").lean();
    }

    const ownerId = attempt.userId || attempt.user;
    if (!questionSet || !ownerId) continue;

    const totalQuestions = attempt.totalQuestions || 0;
    const correctAnswers = attempt.correctAnswers || attempt.score || 0;

    await Attempt.updateOne({ _id: attempt._id }, {
      $set: {
        userId: ownerId,
        questionSetId: questionSet._id,
        correctAnswers,
        wrongAnswers: Math.max(0, totalQuestions - correctAnswers),
        accuracy: totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
        completedAt: attempt.completedAt || attempt.createdAt || new Date(),
        status: attempt.status === "abandoned" ? "abandoned" : "completed"
      }
    });
    stats.attemptsNormalized += 1;
  }

  // 4. Gỡ tham chiếu mô hình cũ (raw driver: schema không còn khai báo các path này).
  const questionCollection = database.collection("questions");
  const attemptCollection = database.collection("attempts");
  await questionCollection.updateMany({ questionSetId: { $ne: null } }, { $unset: { topic: "" } });
  await attemptCollection.updateMany({}, { $unset: { topic: "", user: "" } });
  await attemptCollection.dropIndex("user_1_topic_1_createdAt_-1").catch(() => {});

  await Question.syncIndexes();
  await Attempt.syncIndexes();

  // 5. Xóa collection.
  await topicCollection.drop().catch(() => {});

  return stats;
}
