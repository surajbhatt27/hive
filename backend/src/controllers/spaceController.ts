import e, { Request, Response } from "express";
import { db } from "../db";
import { habitLogs, habits, spaces, userSpaces } from "../db/schema";
import { and, count, eq, gte, inArray, lt, or } from "drizzle-orm";
import { endOfUtcDay, startOfUtcDay } from "../utils/dates";

export const createSpace = async (req: Request, res: Response) => {
    try {
        const {name, description} = req.body;
        const userId = req.userId!;

        const generateSlug = (name: string): string => {
            const base = name.toLowerCase().replace(/\s+/g, '-');
            const random = Math.random().toString(36).substring(2, 8);
            return `${base}-${random}`;
        }

        if(!name || name.trim().length === 0) {
            return res.status(400).json(
                {
                    success: false,
                    message: "space name is required"
                }
            )
        }

        const slug = generateSlug(name);

        const result = await db.transaction(async (tx) => {
            const [newSpace] = await tx.insert(spaces).values({
                name: name.trim(),
                description: description?.trim() || null,
                createdBy: userId,
                slug,
                isActive: true,
            }).returning()

            await tx.insert(userSpaces).values({
                userId,
                spaceId: newSpace.id,
                role: 'admin',
                invitedBy: userId,
                isActive: true
            })

            return newSpace;
        })

        return res.status(201).json({
            success: true,
            data: result,
            message: "Space created successfully"
        });

    } catch (error) {
        console.error("Create space error", error);
        return res.status(500).json({
            success: false,
            message: "failed to create space"
        })
    }
}

export const getSpaces = async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        const userSpacesList = await db.select({
            id: spaces.id,
            name: spaces.name,
            description: spaces.description,
            slug: spaces.slug,
            isActive: spaces.isActive,
            createdAt: spaces.createdAt,
            updatedAt: spaces.updatedAt,
            role: userSpaces.role,
        })
        .from(userSpaces)
        .innerJoin(spaces, eq(userSpaces.spaceId, spaces.id))
        .where(
            and(
                eq(userSpaces.userId, userId),
                eq(userSpaces.isActive, true),
                eq(spaces.isActive, true)
            )
        );

        return res.json({
            success: true,
            data: userSpacesList
        })

    } catch (error) {
        console.error('Error in getting space', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch spaces'
        });
    }
}

export const getSpaceById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const userId = req.userId!;

        const membership = await db.select().from(userSpaces).where(
            and(
                eq(userSpaces.userId, userId),
                eq(userSpaces.spaceId, parseInt(id)),
                eq(userSpaces.isActive, true),
            )
        )

        if(membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not member of this space"
            })
        }

        const space = await db.select().from(spaces).where(eq(spaces.id, parseInt(id)));

        if(!space) {
            return res.status(404).json({
                success: false,
                message: "Space not found"
            })
        }

        return res.status(200).json({
            success: true,
            data: {
                ...space[0],
                role: membership[0].role
            }
        });

    } catch (error) {
        console.error("Error getting space");
        return res.status(500).json({
            success: false,
            message: "failed to fetch space"
        })
    }
}

export const updateSpace = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as {id: string};
        const { name, description } = req.body;
        const userId = req.userId!;

        const membership = await db.select().from(userSpaces).where(
            and(
                eq(userSpaces.userId, userId),
                eq(userSpaces.spaceId, parseInt(id)),
                eq(userSpaces.isActive, true),
            )
        )

        if(membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not member of this space"
            })
        }

        if(membership[0].role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Only admin can update space details"
            })
        }

        const updateData: any = {};
        if(name) updateData.name = name.trim();
        if(description) updateData.description = description?.trim() || null;
        updateData.updatedAt = new Date();

        const [updateSpace] = await db.update(spaces).set(updateData).where(
            eq(spaces.id, parseInt(id))
        ).returning();

        if(!updateSpace) {
            return res.status(404).json({
                success: false,
                message: "Space not found"
            })
        }

        return res.json({
            success: true,
            data: { ...updateSpace, role: membership[0].role },
            message: "Space updated successfully"
        })

    } catch (error) {
        console.error('Update space error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to update space"
        });
    }
}

export const deleteSpace = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as {id: string};
        const userId = req.userId!;

        const membership = await db
            .select()
            .from(userSpaces)
            .where(
                and(
                    eq(userSpaces.userId, userId),
                    eq(userSpaces.spaceId, parseInt(id)),
                    eq(userSpaces.isActive, true)
                )
            );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this space"
            });
        }

        if (membership[0].role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Only admins can delete spaces"
            });
        }

        const [deleteSpace] = await db.update(spaces).set({
            isActive: false,
            updatedAt: new Date()
        }).where(eq(spaces.id, parseInt(id))).returning();

        await db
            .update(userSpaces)
            .set({isActive: false})
            .where(eq(userSpaces.spaceId, parseInt(id)));

        return res.json({
            success: true,
            message: "Space deleted successfully"
        });
    } catch (error) {
        console.error('Delete space error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete space"
        });
    }
}

export const previewSpaceBySlug = async (req: Request, res: Response) => {
    try {
        const slug = String((req.params as Record<string, string>).slug || "").trim();

        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Space slug is required"
            });
        }

        const [space] = await db.select().from(spaces).where(
            and(eq(spaces.slug, slug), eq(spaces.isActive, true))
        );

        if (!space) {
            return res.status(404).json({
                success: false,
                message: "Space not found"
            });
        }

        const [memberCount] = await db.select({ total: count() }).from(userSpaces).where(
            and(eq(userSpaces.spaceId, space.id), eq(userSpaces.isActive, true))
        );

        const membership = await db.select().from(userSpaces).where(
            and(
                eq(userSpaces.userId, req.userId!),
                eq(userSpaces.spaceId, space.id),
                eq(userSpaces.isActive, true)
            )
        );

        return res.json({
            success: true,
            data: {
                id: space.id,
                name: space.name,
                description: space.description,
                slug: space.slug,
                memberCount: Number(memberCount?.total ?? 0),
                isMember: membership.length > 0,
            }
        });

    } catch (error) {
        console.error('Preview space error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to load space"
        });
    }
}

export const joinSpace = async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const slug = typeof req.body?.slug === 'string' ? req.body.slug.trim() : "";

        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Space slug is required"
            });
        }

        const [space] = await db.select().from(spaces).where(
            and(eq(spaces.slug, slug), eq(spaces.isActive, true))
        );

        if (!space) {
            return res.status(404).json({
                success: false,
                message: "Space not found"
            });
        }

        const [existing] = await db.select().from(userSpaces).where(
            and(eq(userSpaces.userId, userId), eq(userSpaces.spaceId, space.id))
        );

        if (existing?.isActive) {
            return res.status(400).json({
                success: false,
                message: "You are already a member of this space"
            });
        }

        if (existing) {
            await db.update(userSpaces)
                .set({
                    isActive: true,
                    role: 'member',
                    joinedAt: new Date(),
                    invitedBy: space.createdBy,
                })
                .where(eq(userSpaces.id, existing.id));
        } else {
            await db.insert(userSpaces).values({
                userId,
                spaceId: space.id,
                role: 'member',
                invitedBy: space.createdBy,
                isActive: true,
            });
        }

        return res.status(200).json({
            success: true,
            data: { ...space, role: 'member' },
            message: `Joined ${space.name}`
        });

    } catch (error) {
        console.error('Join space error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to join space"
        });
    }
}

export const getSpaceSummary = async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        const spaceRows = await db.select({
            id: spaces.id,
            name: spaces.name,
            description: spaces.description,
            slug: spaces.slug,
            createdAt: spaces.createdAt,
            updatedAt: spaces.updatedAt,
            isActive: spaces.isActive,
            role: userSpaces.role,
        })
            .from(userSpaces)
            .innerJoin(spaces, eq(userSpaces.spaceId, spaces.id))
            .where(
                and(
                    eq(userSpaces.userId, userId),
                    eq(userSpaces.isActive, true),
                    eq(spaces.isActive, true)
                )
            )
            .orderBy(spaces.createdAt);

        const spaceIds = spaceRows.map(space => space.id);

        if (spaceIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    spaces: [],
                    totals: { spaces: 0, habits: 0, completedToday: 0, members: 0 }
                }
            });
        }

        const habitRows = await db.select({
            id: habits.id,
            spaceId: habits.spaceId,
            name: habits.name,
            type: habits.type,
        })
            .from(habits)
            .where(
                and(
                    inArray(habits.spaceId, spaceIds),
                    eq(habits.isActive, true),
                    or(
                        eq(habits.type, 'space'),
                        and(eq(habits.type, 'personal'), eq(habits.createdBy, userId))
                    )
                )
            );

        const habitIds = habitRows.map(habit => habit.id);

        const completedRows = habitIds.length > 0
            ? await db.select({ habitId: habitLogs.habitId })
                .from(habitLogs)
                .where(
                    and(
                        eq(habitLogs.userId, userId),
                        inArray(habitLogs.habitId, habitIds),
                        eq(habitLogs.isActive, true),
                        gte(habitLogs.completedAt, startOfUtcDay()),
                        lt(habitLogs.completedAt, endOfUtcDay())
                    )
                )
            : [];

        const completedIds = new Set(completedRows.map(row => row.habitId));

        const memberRows = await db.select({
            spaceId: userSpaces.spaceId,
            total: count(),
        })
            .from(userSpaces)
            .where(
                and(
                    inArray(userSpaces.spaceId, spaceIds),
                    eq(userSpaces.isActive, true)
                )
            )
            .groupBy(userSpaces.spaceId);

        const memberCounts = new Map(memberRows.map(row => [row.spaceId, Number(row.total)]));

        const data = spaceRows.map(space => {
            const spaceHabits = habitRows.filter(habit => habit.spaceId === space.id);
            return {
                ...space,
                memberCount: memberCounts.get(space.id) ?? 0,
                habitCount: spaceHabits.length,
                completedToday: spaceHabits.filter(habit => completedIds.has(habit.id)).length,
                habits: spaceHabits.map(habit => ({
                    id: habit.id,
                    name: habit.name,
                    type: habit.type,
                    completed: completedIds.has(habit.id),
                })),
            };
        });

        return res.json({
            success: true,
            data: {
                spaces: data,
                totals: {
                    spaces: data.length,
                    habits: data.reduce((total, space) => total + space.habitCount, 0),
                    completedToday: data.reduce((total, space) => total + space.completedToday, 0),
                    members: data.reduce((total, space) => total + space.memberCount, 0),
                }
            }
        });

    } catch (error) {
        console.error('Space summary error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to load dashboard summary"
        });
    }
}