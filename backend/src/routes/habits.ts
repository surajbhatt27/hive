import { Router } from "express";
import { createHabit, deleteHabit, getHabitById, getHabits, updateHabit } from "../controllers/habitController";
import { checkIn, getHabitLogs, undoCheckIn } from "../controllers/logController";
import { authMiddleware } from "../middleware/auth";
import { requireSpaceMember } from "../middleware/spaceAuth";

const router = Router({ mergeParams: true });

router.use(authMiddleware);
// Every habit route is scoped to a space, so membership is checked once here
// instead of at the top of each controller.
router.use(requireSpaceMember);

router.get('/', getHabits);
router.post('/', createHabit);
router.get('/:habitId', getHabitById);
router.put('/:habitId', updateHabit);
router.delete('/:habitId', deleteHabit);

router.get('/:habitId/logs', getHabitLogs);
router.post('/:habitId/logs', checkIn);
// `:date` accepts "today" too, so the old /logs/today path still works.
router.delete('/:habitId/logs/:date', undoCheckIn);

export default router;