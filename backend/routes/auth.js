import { Router } from "express";
import { currentUser, login, register } from "../app/Controllers/AuthController.js";
import { requireAuth } from "../app/Middleware/requireAuth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, currentUser);

export default router;