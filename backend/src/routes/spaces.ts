import { Router } from "express";
import { createSpace, deleteSpace, getSpaceById, getSpaces, updateSpace } from "../controllers/spaceController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.post('/', createSpace);
router.get('/', getSpaces);
router.get('/:id', getSpaceById);
router.put('/:id', updateSpace);
router.delete('/:id', deleteSpace);

export default router;