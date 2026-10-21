import mongoose from "mongoose";
import Attempt from "../../app/Models/Attempt.js";
import Category from "../../app/Models/Category.js";
import Package from "../../app/Models/Package.js";
import Progress from "../../app/Models/Progress.js";
import Question from "../../app/Models/Question.js";
import QuestionSet from "../../app/Models/QuestionSet.js";
import Ranking from "../../app/Models/Ranking.js";
import Topic from "../../app/Models/Topic.js";
import User from "../../app/Models/User.js";

export async function migrateLearningEntities() {
  const topics = await Topic.find().sort({ order: 1 }).lean();
  const packageByTopic = new Map();
  const questionSetCountByPackage = new Map();
  let questionsMigrated = 0;
  let questionSetsMigrated = 0;

  for (const topic of topics) {
    const category = await Category.findOneAndUpdate(
      { name: topic.period },
      {
        $setOnInsert: {
          name: topic.period,
          description: `Giai đoạn lịch sử: ${topic.period}`,
          image: "",
          status: "active"
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    const topicQuestions = await Question.find({ topic: topic._id }).sort({ order: 1, _id: 1 }).lean();
    questionsMigrated += topicQuestions.length;
    const totalScore = topicQuestions.reduce((total, question) => total + (question.score ?? 1), 0);
    const entityId = topic._id;

    const learningPackage = await Package.findOneAndUpdate(
      { _id: entityId },
      {
        $set: {
          categoryId: category._id,
          name: topic.title,
          description: topic.summary,
          image: "",
          difficulty: "medium",
          totalScore,
          estimatedTime: 0,
          status: "active"
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    const existingQuestionSets = await QuestionSet.find({ packageId: learningPackage._id })
      .sort({ order: 1, _id: 1 })
      .lean();
    const splitQuestionsIntoStages = topicQuestions.length > 1 && existingQuestionSets.length <= 1;
    let questionSet;

    if (existingQuestionSets.length > 1) {
      questionSet = existingQuestionSets[0];
      questionSetsMigrated += existingQuestionSets.length;
    } else if (splitQuestionsIntoStages) {
      const createdStages = [];
      for (const [index, question] of topicQuestions.entries()) {
        const stageName = `Chặng ${index + 1}: ${topic.title}`.slice(0, 120);
        const stageDescription = `${topic.summary}\n\nThử thách: ${question.prompt}`.slice(0, 2000);
        const stageFilter = index === 0
          ? { _id: existingQuestionSets[0]?._id || entityId }
          : { packageId: learningPackage._id, order: index };
        const stage = await QuestionSet.findOneAndUpdate(
          stageFilter,
          {
            $set: {
              packageId: learningPackage._id,
              name: stageName,
              description: stageDescription,
              order: index,
              difficulty: question.difficulty || "medium",
              score: question.score ?? 1,
              timeLimit: 0,
              unlockCondition: null,
              status: "active"
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();
        createdStages.push(stage);
      }

      questionSet = createdStages[0];
      questionSetsMigrated += createdStages.length;
      await Question.bulkWrite(topicQuestions.map((question, index) => ({
        updateOne: {
          filter: { _id: question._id },
          update: {
            $set: {
              questionSetId: createdStages[index]._id,
              content: question.prompt,
              correctAnswer: question.answerIndex,
              difficulty: question.difficulty || "medium",
              score: question.score ?? 1
            }
          }
        }
      })));
    } else {
      questionSet = await QuestionSet.findOneAndUpdate(
        { _id: existingQuestionSets[0]?._id || entityId },
        {
          $set: {
            packageId: learningPackage._id,
            name: topic.title,
            description: topic.summary,
            order: 0,
            difficulty: "medium",
            score: totalScore,
            timeLimit: 0,
            unlockCondition: null,
            status: "active"
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
      questionSetsMigrated += 1;

      if (topicQuestions.length) {
        await Question.bulkWrite(topicQuestions.map((question) => ({
          updateOne: {
            filter: { _id: question._id },
            update: {
              $set: {
                questionSetId: questionSet._id,
                content: question.prompt,
                correctAnswer: question.answerIndex,
                difficulty: question.difficulty || "medium",
                score: question.score ?? 1
              }
            }
          }
        })));
      }
    }

    packageByTopic.set(topic._id.toString(), {
      packageId: learningPackage._id,
      questionSetId: questionSet._id
    });
    questionSetCountByPackage.set(learningPackage._id.toString(), splitQuestionsIntoStages
      ? topicQuestions.length
      : existingQuestionSets.length > 1 ? existingQuestionSets.length : 1);

  }

  const attempts = await Attempt.find({ topic: { $in: topics.map(({ _id }) => _id) } }).lean();
  if (attempts.length) {
    await Attempt.bulkWrite(attempts.map((attempt) => {
      const entityIds = packageByTopic.get(attempt.topic.toString());
      const correctAnswers = attempt.correctAnswers ?? attempt.score;
      const totalQuestions = attempt.totalQuestions;

      const fieldsToUpdate = {
        correctAnswers,
        wrongAnswers: attempt.wrongAnswers ?? Math.max(0, totalQuestions - correctAnswers),
        accuracy: attempt.accuracy ?? (totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0),
        timeSpent: attempt.timeSpent ?? 0,
        completedAt: attempt.completedAt ?? attempt.createdAt ?? new Date(),
        status: attempt.status ?? "completed"
      };
      if (!attempt.questionSetId) fieldsToUpdate.questionSetId = entityIds.questionSetId;
      if (!attempt.userId && attempt.user) fieldsToUpdate.userId = attempt.user;

      return {
        updateOne: {
          filter: { _id: attempt._id },
          update: { $set: fieldsToUpdate }
        }
      };
    }));
  }

  const userProgress = await Attempt.aggregate([
    { $match: { questionSetId: { $ne: null }, user: { $ne: null }, status: { $nin: ["in_progress", "abandoned"] } } },
    {
      $group: {
        _id: { userId: "$user", questionSetId: "$questionSetId" },
        totalScore: { $max: "$score" }
      }
    },
    {
      $lookup: {
        from: QuestionSet.collection.name,
        localField: "_id.questionSetId",
        foreignField: "_id",
        as: "questionSet"
      }
    },
    { $unwind: "$questionSet" },
    {
      $group: {
        _id: { userId: "$_id.userId", packageId: "$questionSet.packageId" },
        completedSets: { $addToSet: "$_id.questionSetId" },
        totalScore: { $sum: "$totalScore" }
      }
    }
  ]);

  if (userProgress.length) {
    await Progress.bulkWrite(userProgress.map((progress) => {
      const completedSets = progress.completedSets;
      const totalSets = questionSetCountByPackage.get(progress._id.packageId.toString()) || 0;
      const isComplete = totalSets > 0 && completedSets.length >= totalSets;
      return {
        updateOne: {
          filter: { userId: progress._id.userId, packageId: progress._id.packageId },
          update: {
            $set: {
              completedSets,
              currentSet: null,
              unlockedSets: completedSets,
              completedSetsCount: completedSets.length,
              totalSets,
              totalScore: progress.totalScore,
              completionPercent: totalSets ? Math.min(100, Math.round((completedSets.length / totalSets) * 100)) : 0,
              status: isComplete ? "completed" : completedSets.length ? "in_progress" : "not_started"
            }
          },
          upsert: true
        }
      };
    }));
  }

  const rankings = await Attempt.aggregate([
    { $match: { user: { $ne: null }, questionSetId: { $ne: null } } },
    {
      $group: {
        _id: { userId: "$user", questionSetId: "$questionSetId" },
        score: { $max: "$score" }
      }
    },
    {
      $lookup: {
        from: QuestionSet.collection.name,
        localField: "_id.questionSetId",
        foreignField: "_id",
        as: "questionSet"
      }
    },
    { $unwind: "$questionSet" },
    {
      $group: {
        _id: "$_id.userId",
        totalScore: { $sum: "$score" },
        completedSets: { $sum: 1 },
        packages: { $addToSet: "$questionSet.packageId" }
      }
    }
  ]);

  if (rankings.length) {
    await Ranking.bulkWrite(rankings.map((ranking) => ({
      updateOne: {
        filter: { userId: ranking._id },
        update: {
          $set: {
            totalScore: ranking.totalScore,
            completedPackages: ranking.packages.length,
            completedSets: ranking.completedSets,
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    })));

    await User.bulkWrite(rankings.map((ranking) => ({
      updateOne: {
        filter: { _id: ranking._id },
        update: { $set: { totalScore: ranking.totalScore } }
      }
    })));
  }

  await User.updateMany(
    { fullName: { $exists: false }, name: { $exists: true } },
    [{ $set: { fullName: "$name" } }]
  );
  await User.updateMany(
    { avatar: { $exists: false } },
    { $set: { avatar: "" } }
  );
  await User.updateMany(
    { totalScore: { $exists: false } },
    { $set: { totalScore: 0 } }
  );

  return {
    categories: new Set(topics.map(({ period }) => period)).size,
    packages: topics.length,
    questionSets: questionSetsMigrated,
    questions: questionsMigrated,
    attempts: attempts.length,
    usersWithProgress: userProgress.length,
    usersInRanking: rankings.length,
    database: mongoose.connection.name
  };
}
