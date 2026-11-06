import mongoose from "mongoose";
import Attempt from "../Models/Attempt.js";
import Package from "../Models/Package.js";
import Question from "../Models/Question.js";

export async function getLeaderboard(request, response) {
  const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
  const pageSize = 10;
  const search = typeof request.query.search === "string" ? request.query.search.trim().slice(0, 80) : "";
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const userId = request.user.sub;

  const [result] = await Attempt.aggregate([
    { $match: { status: { $nin: ["abandoned", "in_progress"] } } },
    {
      $addFields: {
        rankingUserId: { $ifNull: ["$user", "$userId"] }
      }
    },
    { $match: { rankingUserId: { $ne: null } } },
    {
      $group: {
        _id: "$rankingUserId",
        totalScore: { $sum: "$score" },
        attempts: { $sum: 1 },
        questionSetIds: { $addToSet: "$questionSetId" }
      }
    },
    {
      $lookup: {
        from: "questionSets",
        localField: "questionSetIds",
        foreignField: "_id",
        as: "questionSets"
      }
    },
    {
      $addFields: {
        completedSets: {
          $size: {
            $filter: {
              input: "$questionSetIds",
              as: "questionSetId",
              cond: { $ne: ["$$questionSetId", null] }
            }
          }
        },
        packageIds: {
          $setUnion: [
            { $map: { input: "$questionSets", as: "questionSet", in: "$$questionSet.packageId" } },
            []
          ]
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        name: { $ifNull: ["$user.name", "$user.fullName"] },
        avatar: { $ifNull: ["$user.avatar", ""] },
        totalScore: 1,
        completedSets: 1,
        completedPackages: { $size: "$packageIds" },
        attempts: 1
      }
    },
    {
      $setWindowFields: {
        sortBy: { totalScore: -1 },
        output: { rank: { $rank: {} } }
      }
    },
    {
      $facet: {
        entries: [
          ...(escapedSearch ? [{ $match: { name: { $regex: escapedSearch, $options: "i" } } }] : []),
          { $sort: { rank: 1 } },
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize }
        ],
        podium: [{ $limit: 3 }],
        currentUser: [{ $match: { userId: new mongoose.Types.ObjectId(userId) } }],
        total: [
          ...(escapedSearch ? [{ $match: { name: { $regex: escapedSearch, $options: "i" } } }] : []),
          { $count: "count" }
        ]
      }
    }
  ]);

  const total = result?.total[0]?.count || 0;
  response.json({
    entries: result?.entries || [],
    podium: result?.podium || [],
    currentUser: result?.currentUser[0] || null,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize)
  });
}

export async function getDashboard(request, response) {
  const userId = request.user.sub;
  const [questionCount, packageCount, attempts, recentAttempts] = await Promise.all([
    Question.countDocuments(),
    Package.countDocuments({ status: "active" }),
    Attempt.find({ userId, status: "completed" }).select("score correctAnswers totalQuestions").lean(),
    Attempt.find({ userId, status: { $ne: "abandoned" } })
      .populate("questionSetId", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ]);

  const answered = attempts.reduce((total, attempt) => total + attempt.totalQuestions, 0);
  const correct = attempts.reduce((total, attempt) => total + attempt.correctAnswers, 0);

  response.json({
    questionCount,
    packageCount,
    attempts: attempts.length,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    recentAttempts
  });
}

