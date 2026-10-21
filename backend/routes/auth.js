import { Router } from "express";
import { currentUser, login, register } from "../app/Controllers/AuthController.js";
import { getProfile, updatePassword, updateProfile } from "../app/Controllers/ProfileController.js";
import { requireAuth } from "../app/Middleware/requireAuth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, currentUser);
router.get("/profile", requireAuth, getProfile);
router.patch("/profile", requireAuth, updateProfile);
router.patch("/password", requireAuth, updatePassword);

export default router;