import { Request, Response } from "express";
import { and, count, eq } from "drizzle-orm";
import { db } from "../db";
import { userSpaces, users } from "../db/schema";

const param = (value: string | string[] | undefined): string =>
    Array.isArray(value) ? value[0] : value ?? "";

const toNumber = (value: string): number | null => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const countAdmins = async (spaceId: number): Promise<number> => {
    const [row] = await db.select({ total: count() })
        .from(userSpaces)
        .where(
            and(
                eq(userSpaces.spaceId, spaceId),
                eq(userSpaces.role, 'admin'),
                eq(userSpaces.isActive, true)
            )
        );
    return Number(row?.total ?? 0);
};

export const getMembers = async (req: Request, res: Response) => {
    try {
        const spaceId = toNumber(param(req.params.spaceId));
        if (!spaceId) {
            return res.status(400).json({
                success: false,
                message: "Invalid space id"
            });
        }

        const members = await db.select({
            userId: users.id,
            name: users.name,
            email: users.email,
            role: userSpaces.role,
            joinedAt: userSpaces.joinedAt,
            invitedBy: userSpaces.invitedBy,
        })
            .from(userSpaces)
            .innerJoin(users, eq(userSpaces.userId, users.id))
            .where(
                and(
                    eq(userSpaces.spaceId, spaceId),
                    eq(userSpaces.isActive, true)
                )
            )
            .orderBy(userSpaces.joinedAt);

        return res.json({
            success: true,
            data: members
        });
    } catch (error) {
        console.error('Get members error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch members"
        });
    }
};

export const updateMemberRole = async (req: Request, res: Response) => {
    try {
        const spaceId = toNumber(param(req.params.spaceId));
        const targetUserId = toNumber(param(req.params.userId));
        const role = req.body?.role;

        if (!spaceId || !targetUserId) {
            return res.status(400).json({
                success: false,
                message: "Invalid space or user id"
            });
        }

        if (role !== 'admin' && role !== 'member') {
            return res.status(400).json({
                success: false,
                message: "Role must be either 'admin' or 'member'"
            });
        }

        const [membership] = await db.select().from(userSpaces).where(
            and(
                eq(userSpaces.spaceId, spaceId),
                eq(userSpaces.userId, targetUserId),
                eq(userSpaces.isActive, true)
            )
        );

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: "Member not found in this space"
            });
        }

        if (membership.role === role) {
            return res.json({
                success: true,
                data: { userId: targetUserId, role },
                message: "Role unchanged"
            });
        }

        if (membership.role === 'admin' && role === 'member') {
            const admins = await countAdmins(spaceId);
            if (admins <= 1) {
                return res.status(400).json({
                    success: false,
                    message: "A space must have at least one admin"
                });
            }
        }

        const [updated] = await db.update(userSpaces)
            .set({ role })
            .where(eq(userSpaces.id, membership.id))
            .returning();

        return res.json({
            success: true,
            data: {
                userId: updated.userId,
                role: updated.role,
            },
            message: `Member is now ${updated.role}`
        });
    } catch (error) {
        console.error('Update member role error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to update member role"
        });
    }
};

export const removeMember = async (req: Request, res: Response) => {
    try {
        const spaceId = toNumber(param(req.params.spaceId));
        const targetUserId = toNumber(param(req.params.userId));

        if (!spaceId || !targetUserId) {
            return res.status(400).json({
                success: false,
                message: "Invalid space or user id"
            });
        }

        const [membership] = await db.select().from(userSpaces).where(
            and(
                eq(userSpaces.spaceId, spaceId),
                eq(userSpaces.userId, targetUserId),
                eq(userSpaces.isActive, true)
            )
        );

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: "Member not found in this space"
            });
        }

        const isSelf = targetUserId === req.userId;

        // Members can leave on their own, but only admins can remove others.
        if (!isSelf && req.spaceRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Only admins can remove other members"
            });
        }

        if (membership.role === 'admin') {
            const admins = await countAdmins(spaceId);
            if (admins <= 1) {
                return res.status(400).json({
                    success: false,
                    message: isSelf
                        ? "You are the only admin. Promote another member before leaving."
                        : "A space must have at least one admin"
                });
            }
        }

        await db.update(userSpaces)
            .set({ isActive: false })
            .where(eq(userSpaces.id, membership.id));

        return res.json({
            success: true,
            message: isSelf ? "You left the space" : "Member removed from space"
        });
    } catch (error) {
        console.error('Remove member error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to remove member"
        });
    }
};
