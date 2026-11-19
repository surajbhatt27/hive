import { Router } from "express";
import { createHabit, deleteHabit, getHabitById, getHabits, updateHabit } from "../controllers/habitController";
import { checkIn, getHabitLogs, undoCheckIn } from "../controllers/logController";
import { authMiddleware } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', getHabits);
router.post('/', createHabit);
router.get('/:habitId', getHabitById);
router.put('/:habitId', updateHabit);
router.delete('/:habitId', deleteHabit);

router.get('/:habitId/logs', getHabitLogs);
router.post('/:habitId/logs', checkIn);
router.delete('/:habitId/logs/today', undoCheckIn);

export default router;