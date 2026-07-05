import { Router } from "express";
import { createHabit, deleteHabit, getHabitById, getHabits, updateHabit } from "../controllers/habitController";
import { authMiddleware } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', getHabits);
router.post('/', createHabit);
router.get('/:habitId', getHabitById);
router.put('/:habitId', updateHabit);
router.delete('/:habitId', deleteHabit);

export default router;