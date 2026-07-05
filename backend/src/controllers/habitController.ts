import { Request, Response } from "express";
import { db } from "../db";
import { habits, userSpaces } from "../db/schema";
import { and, eq, inArray } from "drizzle-orm";

export const getHabits = async (req: Request, res: Response) => {
    try {
        const { spaceId } = req.params;
        const userId = req.userId!;
        const { type } = req.query;
        const spaceIdString = Array.isArray(spaceId) ? spaceId[0] : spaceId;

        const membership = await db.select().from(userSpaces).where(and
            (
                eq(userSpaces.userId, userId),
                eq(userSpaces.spaceId, parseInt(spaceIdString, 10)),
                eq(userSpaces.isActive, true)
            )
        )

        if(membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this space'
            })
        }

        const conditions = [
            eq(habits.spaceId, parseInt(spaceIdString, 10)),
            eq(habits.isActive, true)
        ]

        if(type === 'space') {
            conditions.push(eq(habits.type, 'space'))
        } else if(type === 'personal') {
            conditions.push(
                eq(habits.type, 'personal'),
                eq(habits.createdBy, userId)
            )
        }else {
            conditions.push(
                inArray(habits.type, ['space', 'personal']),
                eq(habits.createdBy, userId)
            )
        }

        let habitList;

        if(type === 'space') {
            habitList = await db.select().from(habits).where(
                and(
                    eq(habits.spaceId, parseInt(spaceIdString)),
                    eq(habits.type, 'space'),
                    eq(habits.isActive, true)
                )
            )
        }else if (type === 'personal') {
            habitList = await db.select().from(habits).where(
                and(
                    eq(habits.spaceId, parseInt(spaceIdString)),
                    eq(habits.type, 'personal'),
                    eq(habits.createdBy, userId),
                    eq(habits.isActive, true)
                )
            );
        } else {
            const spaceHabits = await db.select().from(habits).where(
                and(
                    eq(habits.spaceId, parseInt(spaceIdString)),
                    eq(habits.type, 'space'),
                    eq(habits.isActive, true)
                )
            );

            const personalHabits = await db.select().from(habits).where(
                and(
                    eq(habits.spaceId, parseInt(spaceIdString)),
                    eq(habits.type, 'personal'),
                    eq(habits.createdBy, userId),
                    eq(habits.isActive, true)
                )
            );
            habitList = [...spaceHabits, ...personalHabits];
        }
        return res.json({
            success: true,
            data: habitList
        })
    } catch (error) {
        console.error('Get habits error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch habits"
        });
    }
}

export const getHabitById = async (req: Request, res: Response) => {
    try {
        const { spaceId, habitId } = req.params;
        const userId = req.userId!;
        const spaceIdString = Array.isArray(spaceId) ? spaceId[0] : spaceId;
        const habitIdString = Array.isArray(habitId) ? habitId[0] : habitId;

        const membership = await db.select().from(userSpaces).where(
            and(
                eq(userSpaces.userId, userId),
                eq(userSpaces.spaceId, parseInt(spaceIdString)),
                eq(userSpaces.isActive, true)
            )
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this space"
            });
        }

        const habit = await db.select().from(habits).where(
            and(
                eq(habits.id, parseInt(habitIdString)),
                eq(habits.spaceId, parseInt(spaceIdString)),
                eq(habits.isActive, true)
            )
        );

        if (habit.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Habit not found"
            });
        }

        if (habit[0].type === 'personal' && habit[0].createdBy !== userId) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to view this habit"
            });
        }

        return res.json({
            success: true,
            data: habit[0]
        });
    } catch (error) {
        console.error('Get habit by ID error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch habit"
        });
    }
}

export const createHabit = async (req: Request, res: Response) => {
    try {
        const { spaceId } = req.params;
        const spaceIdString = Array.isArray(spaceId) ? spaceId[0] : spaceId;
        const userId = req.userId!;
        const { name, description, type, frequency } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Habit name is required"
            });
        }

        const membership = await db.select().from(userSpaces).where(
            and(
                eq(userSpaces.userId, userId),
                eq(userSpaces.spaceId, parseInt(spaceIdString)),
                eq(userSpaces.isActive, true)
            )
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this space"
            });
        }

        let habitType = type || 'personal';

        if (habitType === 'space' && membership[0].role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Only admins can create space habits"
            });
        }

        if (!type) {
            habitType = 'personal';
        }

        const validFrequencies = ['daily', 'weekly', 'monthly', 'custom'];
        const habitFrequency = frequency || 'daily';
        if (!validFrequencies.includes(habitFrequency)) {
            return res.status(400).json({
                success: false,
                message: "Invalid frequency. Must be: daily, weekly, monthly, or custom"
            });
        }

        const [newHabit] = await db.insert(habits).values({
            spaceId: parseInt(spaceIdString),
            createdBy: userId,
            name: name.trim(),
            description: description?.trim() || null,
            type: habitType,
            frequency: habitFrequency,
            isActive: true,
        }).returning();

        return res.status(201).json({
            success: true,
            data: newHabit,
            message: "Habit created successfully"
        });

    } catch (error) {
        console.error('Create habit error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to create habit"
        });
    }
}

export const updateHabit = async (req: Request, res: Response) => {
    try {
        const { spaceId, habitId } = req.params;
        const spaceIdString = Array.isArray(spaceId) ? spaceId[0] : spaceId;
        const habitIdString = Array.isArray(habitId) ? habitId[0] : habitId;
        const userId = req.userId!;
        const { name, description, frequency } = req.body;

        const membership = await db.select().from(userSpaces).where(
            and(
                eq(userSpaces.userId, userId),
                eq(userSpaces.spaceId, parseInt(spaceIdString)),
                eq(userSpaces.isActive, true)
            )
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this space"
            });
        }

        const habit = await db.select().from(habits).where(
            and(
                eq(habits.id, parseInt(habitIdString)),
                eq(habits.spaceId, parseInt(spaceIdString)),
                eq(habits.isActive, true)
            )
        );

        if (habit.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Habit not found"
            });
        }

        const isAdmin = membership[0].role === 'admin';
        const isCreator = habit[0].createdBy === userId;

        if (habit[0].type === 'space' && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only admins can edit space habits"
            });
        }

        if (habit[0].type === 'personal' && !isCreator) {
            return res.status(403).json({
                success: false,
                message: "Only the creator can edit this personal habit"
            });
        }

        const updateData: any = {};
        if (name) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (frequency) {
            const validFrequencies = ['daily', 'weekly', 'monthly', 'custom'];
            if (!validFrequencies.includes(frequency)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid frequency. Must be: daily, weekly, monthly, or custom"
                });
            }
            updateData.frequency = frequency;
        }
        updateData.updatedAt = new Date();

        const [updatedHabit] = await db.update(habits)
            .set(updateData)
            .where(eq(habits.id, parseInt(habitIdString)))
            .returning();

        return res.json({
            success: true,
            data: updatedHabit,
            message: "Habit updated successfully"
        });

    } catch (error) {
        console.error('Update habit error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to update habit"
        });
    }
}

export const deleteHabit = async (req: Request, res: Response) => {
    try {
        const { spaceId, habitId } = req.params;
        const spaceIdString = Array.isArray(spaceId) ? spaceId[0] : spaceId;
        const habitIdString = Array.isArray(habitId) ? habitId[0] : habitId;
        const userId = req.userId!;

        const membership = await db.select().from(userSpaces).where(
            and(
                eq(userSpaces.userId, userId),
                eq(userSpaces.spaceId, parseInt(spaceIdString)),
                eq(userSpaces.isActive, true)
            )
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this space"
            });
        }

        const habit = await db.select().from(habits).where(
            and(
                eq(habits.id, parseInt(habitIdString)),
                eq(habits.spaceId, parseInt(spaceIdString)),
                eq(habits.isActive, true)
            )
        );

        if (habit.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Habit not found"
            });
        }

        const isAdmin = membership[0].role === 'admin';
        const isCreator = habit[0].createdBy === userId;

        if (habit[0].type === 'space' && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only admins can delete space habits"
            });
        }

        if (habit[0].type === 'personal' && !isCreator) {
            return res.status(403).json({
                success: false,
                message: "Only the creator can delete this personal habit"
            });
        }

        const [deletedHabit] = await db.update(habits)
            .set({
                isActive: false,
                updatedAt: new Date()
            })
            .where(eq(habits.id, parseInt(habitIdString)))
            .returning();

        return res.json({
            success: true,
            message: "Habit deleted successfully"
        });
    } catch (error) {
        console.error('Delete habit error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete habit"
        });
    }
}