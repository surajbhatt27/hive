import { Router } from "express";
import { getMe, login, logout, refresh, register } from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', authMiddleware, getMe);
router.post('/logout', logout);

export default router;