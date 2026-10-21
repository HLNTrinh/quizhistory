import { Router } from "express";
import {
  getPackageDetails, getQuestionSetQuiz, listPackages, submitQuestionSetAttempt
} from "../app/Controllers/PackageController.js";
import { getDashboard, getLeaderboard, getQuiz, listTopics, submitAttempt } from "../app/Controllers/StudyController.js";
import { requireAuth } from "../app/Middleware/requireAuth.js";

const router = Router();

router.get("/dashboard", requireAuth, getDashboard);
router.get("/leaderboard", requireAuth, getLeaderboard);
router.get("/packages", requireAuth, listPackages);
router.get("/packages/:packageId", requireAuth, getPackageDetails);
router.get("/topics", listTopics);
router.get("/question-sets/:questionSetId/quiz", requireAuth, getQuestionSetQuiz);
router.get("/quizzes/:topicId", getQuiz);
router.post("/attempts", requireAuth, submitAttempt);
router.post("/question-set-attempts", requireAuth, submitQuestionSetAttempt);

export default router;