import { Request, Response } from "express";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "../db";
import { habitLogs, habits, userSpaces, users } from "../db/schema";
import { addDays, dayRange, normalizeTimeZone, toDateKey } from "../utils/dates";
import { isDueOn, scheduleOf } from "../utils/schedule";

// Streaks are looked up in the stored 400-day log window.
const STREAK_HORIZON_DAYS = 400;

export interface HabitStat {
    completedToday: boolean;
    dueToday: boolean;
    streak: number;
    lastCompletedAt: Date | null;
}

interface HabitForStats {
    id: number;
    frequency: string;
    schedule: unknown;
    createdAt: Date;
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

// "Today" is the user's local calendar day, not UTC: someone in IST checking
// in at 00:30 belongs to the day that just started for them.
export const getUserTimeZone = async (userId: number): Promise<string> => {
    const [row] = await db.select({ timezone: users.timezone })
        .from(users)
        .where(eq(users.id, userId));
    return normalizeTimeZone(row?.timezone);
};

export const getHabitStats = async (
    userId: number,
    habitList: HabitForStats[],
    timeZone?: string
): Promise<Map<number, HabitStat>> => {
    const stats = new Map<number, HabitStat>();
    if (habitList.length === 0) return stats;

    const habitIds = habitList.map(habit => habit.id);
    const zone = timeZone ?? await getUserTimeZone(userId);
    const todayKey = toDateKey(new Date(), zone);
    const horizonKey = addDays(todayKey, -STREAK_HORIZON_DAYS);

    const logs = await db.select({
        habitId: habitLogs.habitId,
        logDate: habitLogs.logDate,
        completedAt: habitLogs.completedAt,
    })
        .from(habitLogs)
        .where(
            and(
                eq(habitLogs.userId, userId),
                inArray(habitLogs.habitId, habitIds),
                eq(habitLogs.isActive, true),
                gte(habitLogs.logDate, horizonKey)
            )
        );

    const daysByHabit = new Map<number, Set<string>>();
    const lastByHabit = new Map<number, Date>();

    for (const log of logs) {
        if (!daysByHabit.has(log.habitId)) {
            daysByHabit.set(log.habitId, new Set<string>());
        }
        daysByHabit.get(log.habitId)!.add(log.logDate);

        const previous = lastByHabit.get(log.habitId);
        if (!previous || log.completedAt > previous) {
            lastByHabit.set(log.habitId, log.completedAt);
        }
    }

    for (const habit of habitList) {
        const days = daysByHabit.get(habit.id);
        const schedule = scheduleOf(habit);
        const anchorKey = toDateKey(habit.createdAt, zone);
        const dueToday = isDueOn(schedule, todayKey, anchorKey);

        // A due-but-unfinished today does not break the streak until the day
        // ends, and days the habit is not scheduled for are skipped entirely.
        let cursor = dueToday && !days?.has(todayKey) ? addDays(todayKey, -1) : todayKey;
        let streak = 0;

        while (cursor >= horizonKey) {
            if (isDueOn(schedule, cursor, anchorKey)) {
                if (!days?.has(cursor)) break;
                streak += 1;
            }
            cursor = addDays(cursor, -1);
        }

        stats.set(habit.id, {
            completedToday: days?.has(todayKey) ?? false,
            dueToday,
            streak,
            lastCompletedAt: lastByHabit.get(habit.id) ?? null,
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

        // A check-in can add, replace or clear (empty string) the day's note.
        const hasNote = typeof req.body?.note === 'string';
        const note = hasNote ? (req.body.note.trim().slice(0, 500) || null) : null;

        const timeZone = await getUserTimeZone(userId);
        const { key } = dayRange(new Date(), timeZone);

        // The unique index on (habit, user, log_date) makes this the one place
        // that decides a completion for the day, so a double click is a no-op
        // rather than a duplicate row.
        await db.insert(habitLogs).values({
            habitId,
            userId,
            logDate: key,
            completedAt: new Date(),
            note,
            isActive: true,
        }).onConflictDoUpdate({
            target: [habitLogs.habitId, habitLogs.userId, habitLogs.logDate],
            set: {
                isActive: true,
                completedAt: new Date(),
                ...(hasNote ? { note } : {}),
            },
        });

        const stats = await getHabitStats(userId, [habit], timeZone);

        return res.status(201).json({
            success: true,
            data: {
                completedToday: true,
                dueToday: stats.get(habitId)?.dueToday ?? false,
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

        const timeZone = await getUserTimeZone(userId);
        const { key } = dayRange(new Date(), timeZone);

        const [existing] = await db.select().from(habitLogs).where(
            and(
                eq(habitLogs.habitId, habitId),
                eq(habitLogs.userId, userId),
                eq(habitLogs.logDate, key),
                eq(habitLogs.isActive, true)
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

        const stats = await getHabitStats(userId, [habit], timeZone);

        return res.json({
            success: true,
            data: {
                completedToday: false,
                dueToday: stats.get(habitId)?.dueToday ?? false,
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

        const timeZone = await getUserTimeZone(userId);
        const todayKey = toDateKey(new Date(), timeZone);

        // Space habits are shared, so members can see who completed them.
        const showAllMembers = habit.type === 'space';

        const conditions = [
            eq(habitLogs.habitId, habitId),
            eq(habitLogs.isActive, true),
            gte(habitLogs.logDate, addDays(todayKey, -90)),
        ];

        if (!showAllMembers) {
            conditions.push(eq(habitLogs.userId, userId));
        }

        const logs = await db.select({
            id: habitLogs.id,
            userId: habitLogs.userId,
            userName: users.name,
            logDate: habitLogs.logDate,
            completedAt: habitLogs.completedAt,
            note: habitLogs.note,
        })
            .from(habitLogs)
            .innerJoin(users, eq(habitLogs.userId, users.id))
            .where(and(...conditions))
            .orderBy(desc(habitLogs.logDate), desc(habitLogs.completedAt));

        const stats = await getHabitStats(userId, [habit], timeZone);
        const stat = stats.get(habitId);

        return res.json({
            success: true,
            data: {
                logs,
                completedToday: stat?.completedToday ?? false,
                dueToday: stat?.dueToday ?? false,
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
