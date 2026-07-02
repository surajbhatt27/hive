import e, { Request, Response } from "express";
import { db } from "../db";
import { spaces, userSpaces } from "../db/schema";
import { and, eq } from "drizzle-orm";

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
        .innerJoin(spaces, eq(userSpaces.id, spaces.id))
        .where(
            and(
                eq(userSpaces.userId, userId),
                eq(userSpaces.isActive, true)
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
                success: true,
                message: "Space not found"
            })
        }

        return res.json({
            success: true,
            data: updateData,
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
            .where(eq(userSpaces.userId, parseInt(id)));

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