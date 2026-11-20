import { Router } from "express";
import { getMembers, removeMember, updateMemberRole } from "../controllers/memberController";
import { authMiddleware } from "../middleware/auth";
import { requireSpaceAdmin, requireSpaceMember } from "../middleware/spaceAuth";

const router = Router({ mergeParams: true });

router.use(authMiddleware);
router.use(requireSpaceMember);

router.get('/', getMembers);
router.put('/:userId', requireSpaceAdmin, updateMemberRole);
// No admin gate here: every member may remove themselves. The controller
// blocks members from removing anyone else.
router.delete('/:userId', removeMember);

export default router;
