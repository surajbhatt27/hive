import { Router } from "express";
import { getMembers, removeMember, updateMemberRole } from "../controllers/memberController";
import { authMiddleware } from "../middleware/auth";
import { requireSpaceAdmin, requireSpaceMember } from "../middleware/spaceAuth";

const router = Router({ mergeParams: true });

router.use(authMiddleware);
router.use(requireSpaceMember);

router.get('/', getMembers);
router.put('/:userId', requireSpaceAdmin, updateMemberRole);
router.delete('/:userId', requireSpaceAdmin, removeMember);

export default router;
