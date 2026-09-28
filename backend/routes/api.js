import { Router } from "express";
import { getDashboard, getQuiz, listTopics, submitAttempt } from "../app/Controllers/StudyController.js";
import { requireAuth } from "../app/Middleware/requireAuth.js";

const router = Router();

router.get("/dashboard", requireAuth, getDashboard);
router.get("/topics", listTopics);
router.get("/quizzes/:topicId", getQuiz);
router.post("/attempts", requireAuth, submitAttempt);

export default router;