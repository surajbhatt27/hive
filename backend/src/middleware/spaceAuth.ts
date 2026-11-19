import { Request, Response, NextFunction } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { userSpaces } from "../db/schema";

declare global {
    namespace Express {
        interface Request {
            spaceRole?: 'admin' | 'member';
        }
    }
}

const parseSpaceId = (req: Request): number | null => {
    const raw = req.params.spaceId ?? req.params.id;
    const value = Array.isArray(raw) ? raw[0] : raw;
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const requireSpaceMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const spaceId = parseSpaceId(req);
        if (!spaceId) {
            return res.status(400).json({
                success: false,
                message: "Invalid space id"
            });
        }

        const [membership] = await db.select().from(userSpaces).where(
            and(
                eq(userSpaces.userId, req.userId!),
                eq(userSpaces.spaceId, spaceId),
                eq(userSpaces.isActive, true)
            )
        );

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this space"
            });
        }

        req.spaceRole = membership.role === 'admin' ? 'admin' : 'member';
        next();
    } catch (error) {
        console.error('Space membership check error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify space membership"
        });
    }
}

export const requireSpaceAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.spaceRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: "Only admins can perform this action"
        });
    }
    next();
}
