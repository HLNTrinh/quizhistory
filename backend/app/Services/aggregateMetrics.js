import Package from "../Models/Package.js";
import Question from "../Models/Question.js";
import QuestionSet from "../Models/QuestionSet.js";

function toScore(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

export async function syncQuestionSetMetrics(questionSetId) {
  if (!questionSetId) return null;

  const questionSet = await QuestionSet.findById(questionSetId);
  if (!questionSet) return null;

  const result = await Question.aggregate([
    { $match: { questionSetId: questionSet._id } },
    { $group: { _id: null, score: { $sum: "$score" } } }
  ]);

  questionSet.score = toScore(result[0]?.score);
  await questionSet.save();

  if (questionSet.packageId) await syncPackageMetrics(questionSet.packageId);
  return questionSet;
}

export async function syncPackageMetrics(packageId) {
  if (!packageId) return null;

  const learningPackage = await Package.findById(packageId);
  if (!learningPackage) return null;

  const questionSets = await QuestionSet.find({ packageId: learningPackage._id })
    .select("score timeLimit")
    .lean();

  learningPackage.totalScore = questionSets.reduce(
    (total, questionSet) => total + toScore(questionSet.score),
    0
  );
  learningPackage.estimatedTime = questionSets.reduce(
    (total, questionSet) => total + toScore(questionSet.timeLimit),
    0
  );
  await learningPackage.save();

  return learningPackage;
}

export async function syncAllAggregates() {
  const questionSets = await QuestionSet.find({}).select("_id").lean();
  for (const questionSet of questionSets) {
    await syncQuestionSetMetrics(questionSet._id);
  }

  const packages = await Package.find({}).select("_id").lean();
  for (const learningPackage of packages) {
    await syncPackageMetrics(learningPackage._id);
  }
}
