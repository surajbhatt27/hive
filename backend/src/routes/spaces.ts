import { Router } from "express";
import { createSpace, deleteSpace, getSpaceById, getSpaceSummary, getSpaces, joinSpace, previewSpaceBySlug, updateSpace } from "../controllers/spaceController";
import { authMiddleware, optionalAuth } from "../middleware/auth";
import memberRoutes from "./members";

const router = Router();

// Public: an invite link has to show the space before the visitor signs up.
router.get('/preview/:slug', optionalAuth, previewSpaceBySlug);

router.use(authMiddleware);

router.get('/summary', getSpaceSummary);
router.post('/join', joinSpace);

router.post('/', createSpace);
router.get('/', getSpaces);

router.use('/:spaceId/members', memberRoutes);

router.get('/:id', getSpaceById);
router.put('/:id', updateSpace);
router.delete('/:id', deleteSpace);

export default router;