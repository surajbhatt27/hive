import { Router } from "express";
import { createSpace, deleteSpace, getSpaceById, getSpaceSummary, getSpaces, joinSpace, previewSpaceBySlug, updateSpace } from "../controllers/spaceController";
import { authMiddleware } from "../middleware/auth";
import memberRoutes from "./members";

const router = Router();

router.use(authMiddleware);

router.get('/summary', getSpaceSummary);
router.post('/join', joinSpace);
router.get('/preview/:slug', previewSpaceBySlug);

router.post('/', createSpace);
router.get('/', getSpaces);

router.use('/:spaceId/members', memberRoutes);

router.get('/:id', getSpaceById);
router.put('/:id', updateSpace);
router.delete('/:id', deleteSpace);

export default router;