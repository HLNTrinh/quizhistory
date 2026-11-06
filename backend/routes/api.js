import { Router } from "express";
import {
  getPackageDetails, getQuestionSetQuiz, listPackages, submitQuestionSetAttempt
} from "../app/Controllers/PackageController.js";
import { getDashboard, getLeaderboard } from "../app/Controllers/StudyController.js";
import { optionalAuth, requireAuth } from "../app/Middleware/requireAuth.js";

const router = Router();

router.get("/dashboard", requireAuth, getDashboard);
router.get("/leaderboard", requireAuth, getLeaderboard);
router.get("/packages", optionalAuth, listPackages);
router.get("/packages/:packageId", optionalAuth, getPackageDetails);
router.get("/question-sets/:questionSetId/quiz", requireAuth, getQuestionSetQuiz);
router.post("/question-set-attempts", requireAuth, submitQuestionSetAttempt);

export default router;