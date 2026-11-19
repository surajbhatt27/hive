import { Request, Response } from "express";
import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "../db";
import { habitLogs, habits, userSpaces, users } from "../db/schema";
import { daysAgo, endOfUtcDay, startOfUtcDay, toUtcDateKey } from "../utils/dates";

export interface HabitStat {
    completedToday: boolean;
    streak: number;
    lastCompletedAt: Date | null;
}

const param = (value: string | string[] | undefined): string =>
    Array.isArray(value) ? value[0] : value ?? "";

const toNumber = (value: string): number | null => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const findMembership = async (userId: number, spaceId: number) => {
    const [membership] = await db.select().from(userSpaces).where(
        and(
            eq(userSpaces.userId, userId),
            eq(userSpaces.spaceId, spaceId),
            eq(userSpaces.isActive, true)
        )
    );
    return membership ?? null;
};

const findHabit = async (spaceId: number, habitId: number) => {
    const [habit] = await db.select().from(habits).where(
        and(
            eq(habits.id, habitId),
            eq(habits.spaceId, spaceId),
            eq(habits.isActive, true)
        )
    );
    return habit ?? null;
};

export const getHabitStats = async (
    userId: number,
    habitIds: number[]
): Promise<Map<number, HabitStat>> => {
    const stats = new Map<number, HabitStat>();
    for (const habitId of habitIds) {
        stats.set(habitId, { completedToday: false, streak: 0, lastCompletedAt: null });
    }
    if (habitIds.length === 0) return stats;

    const logs = await db.select({
        habitId: habitLogs.habitId,
        completedAt: habitLogs.completedAt,
    })
        .from(habitLogs)
        .where(
            and(
                eq(habitLogs.userId, userId),
                inArray(habitLogs.habitId, habitIds),
                eq(habitLogs.isActive, true),
                gte(habitLogs.completedAt, daysAgo(400))
            )
        );

    const daysByHabit = new Map<number, Set<string>>();
    const lastByHabit = new Map<number, Date>();

    for (const log of logs) {
        if (!daysByHabit.has(log.habitId)) {
            daysByHabit.set(log.habitId, new Set<string>());
        }
        daysByHabit.get(log.habitId)!.add(toUtcDateKey(log.completedAt));

        const previous = lastByHabit.get(log.habitId);
        if (!previous || log.completedAt > previous) {
            lastByHabit.set(log.habitId, log.completedAt);
        }
    }

    const today = startOfUtcDay();

    for (const habitId of habitIds) {
        const days = daysByHabit.get(habitId);
        if (!days) continue;

        let streak = 0;
        const cursor = new Date(today);
        // A streak stays alive until today ends, so count from yesterday when
        // today has not been completed yet.
        if (!days.has(toUtcDateKey(cursor))) {
            cursor.setUTCDate(cursor.getUTCDate() - 1);
        }
        while (days.has(toUtcDateKey(cursor))) {
            streak += 1;
            cursor.setUTCDate(cursor.getUTCDate() - 1);
        }

        stats.set(habitId, {
            completedToday: days.has(toUtcDateKey(today)),
            streak,
            lastCompletedAt: lastByHabit.get(habitId) ?? null,
        });
    }

    return stats;
};

export const checkIn = async (req: Request, res: Response) => {
    try {
        const spaceId = toNumber(param(req.params.spaceId));
        const habitId = toNumber(param(req.params.habitId));
        const userId = req.userId!;

        if (!spaceId || !habitId) {
            return res.status(400).json({
                success: false,
                message: "Invalid space or habit id"
            });
        }

        const membership = await findMembership(userId, spaceId);
        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this space"
            });
        }

        const habit = await findHabit(spaceId, habitId);
        if (!habit) {
            return res.status(404).json({
                success: false,
                message: "Habit not found"
            });
        }

        if (habit.type === 'personal' && habit.createdBy !== userId) {
            return res.status(403).json({
                success: false,
                message: "Only the creator can complete this personal habit"
            });
        }

        const note = typeof req.body?.note === 'string' && req.body.note.trim()
            ? req.body.note.trim().slice(0, 500)
            : null;

        const [existing] = await db.select().from(habitLogs).where(
            and(
                eq(habitLogs.habitId, habitId),
                eq(habitLogs.userId, userId),
                gte(habitLogs.completedAt, startOfUtcDay()),
                lt(habitLogs.completedAt, endOfUtcDay())
            )
        );

        if (existing?.isActive) {
            return res.status(409).json({
                success: false,
                message: "Habit already completed today"
            });
        }

        if (existing) {
            await db.update(habitLogs)
                .set({
                    isActive: true,
                    completedAt: new Date(),
                    note: note ?? existing.note,
                })
                .where(eq(habitLogs.id, existing.id));
        } else {
            await db.insert(habitLogs).values({
                habitId,
                userId,
                note,
                isActive: true,
            });
        }

        const stats = await getHabitStats(userId, [habitId]);

        return res.status(201).json({
            success: true,
            data: {
                completedToday: true,
                streak: stats.get(habitId)?.streak ?? 1,
                lastCompletedAt: stats.get(habitId)?.lastCompletedAt ?? new Date(),
            },
            message: "Habit completed"
        });
    } catch (error) {
        console.error('Check in error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to complete habit"
        });
    }
};

export const undoCheckIn = async (req: Request, res: Response) => {
    try {
        const spaceId = toNumber(param(req.params.spaceId));
        const habitId = toNumber(param(req.params.habitId));
        const userId = req.userId!;

        if (!spaceId || !habitId) {
            return res.status(400).json({
                success: false,
                message: "Invalid space or habit id"
            });
        }

        const membership = await findMembership(userId, spaceId);
        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this space"
            });
        }

        const habit = await findHabit(spaceId, habitId);
        if (!habit) {
            return res.status(404).json({
                success: false,
                message: "Habit not found"
            });
        }

        if (habit.type === 'personal' && habit.createdBy !== userId) {
            return res.status(403).json({
                success: false,
                message: "Only the creator can update this personal habit"
            });
        }

        const [existing] = await db.select().from(habitLogs).where(
            and(
                eq(habitLogs.habitId, habitId),
                eq(habitLogs.userId, userId),
                eq(habitLogs.isActive, true),
                gte(habitLogs.completedAt, startOfUtcDay()),
                lt(habitLogs.completedAt, endOfUtcDay())
            )
        );

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "No completion logged today"
            });
        }

        await db.update(habitLogs)
            .set({ isActive: false })
            .where(eq(habitLogs.id, existing.id));

        const stats = await getHabitStats(userId, [habitId]);

        return res.json({
            success: true,
            data: {
                completedToday: false,
                streak: stats.get(habitId)?.streak ?? 0,
                lastCompletedAt: stats.get(habitId)?.lastCompletedAt ?? null,
            },
            message: "Completion removed"
        });
    } catch (error) {
        console.error('Undo check in error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to remove completion"
        });
    }
};

export const getHabitLogs = async (req: Request, res: Response) => {
    try {
        const spaceId = toNumber(param(req.params.spaceId));
        const habitId = toNumber(param(req.params.habitId));
        const userId = req.userId!;

        if (!spaceId || !habitId) {
            return res.status(400).json({
                success: false,
                message: "Invalid space or habit id"
            });
        }

        const membership = await findMembership(userId, spaceId);
        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this space"
            });
        }

        const habit = await findHabit(spaceId, habitId);
        if (!habit) {
            return res.status(404).json({
                success: false,
                message: "Habit not found"
            });
        }

        if (habit.type === 'personal' && habit.createdBy !== userId) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to view this habit"
            });
        }

        // Space habits are shared, so members can see who completed them.
        const showAllMembers = habit.type === 'space';

        const conditions = [
            eq(habitLogs.habitId, habitId),
            eq(habitLogs.isActive, true),
            gte(habitLogs.completedAt, daysAgo(90)),
        ];

        if (!showAllMembers) {
            conditions.push(eq(habitLogs.userId, userId));
        }

        const logs = await db.select({
            id: habitLogs.id,
            userId: habitLogs.userId,
            userName: users.name,
            completedAt: habitLogs.completedAt,
            note: habitLogs.note,
        })
            .from(habitLogs)
            .innerJoin(users, eq(habitLogs.userId, users.id))
            .where(and(...conditions))
            .orderBy(desc(habitLogs.completedAt));

        const stats = await getHabitStats(userId, [habitId]);
        const stat = stats.get(habitId);

        return res.json({
            success: true,
            data: {
                logs,
                completedToday: stat?.completedToday ?? false,
                streak: stat?.streak ?? 0,
                lastCompletedAt: stat?.lastCompletedAt ?? null,
            }
        });
    } catch (error) {
        console.error('Get habit logs error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch habit history"
        });
    }
};
