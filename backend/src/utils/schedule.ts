// Habit schedules: what "due today" means and which days count toward a streak.
// Dates are the user's local calendar keys (YYYY-MM-DD), never instants.

export type HabitSchedule =
    | { kind: 'daily' }
    | { kind: 'weekly'; weekdays: number[] } // 0 = Sunday … 6 = Saturday
    | { kind: 'monthly'; monthDays: number[] } // 1 … 31, clamped to shorter months
    | { kind: 'custom'; intervalDays: number }; // every N days, counted from the habit's start

export const FREQUENCIES = ['daily', 'weekly', 'monthly', 'custom'] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const isFrequency = (value: unknown): value is Frequency =>
    typeof value === 'string' && (FREQUENCIES as readonly string[]).includes(value);

const isWeekday = (value: unknown): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6;

const isMonthDay = (value: unknown): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 31;

const isIntervalDays = (value: unknown): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 365;

const uniqueSorted = (values: number[]): number[] =>
    [...new Set(values)].sort((a, b) => a - b);

export interface ScheduleInput {
    weekdays?: unknown;
    monthDays?: unknown;
    intervalDays?: unknown;
}

// Validates what the client sent for a frequency and turns it into a schedule.
export const parseScheduleInput = (
    frequency: Frequency,
    input: ScheduleInput
): { schedule: HabitSchedule } | { error: string } => {
    if (frequency === 'daily') {
        return { schedule: { kind: 'daily' } };
    }

    if (frequency === 'weekly') {
        const weekdays = Array.isArray(input.weekdays) ? input.weekdays.filter(isWeekday) : [];
        if (weekdays.length === 0) {
            return { error: "Pick at least one weekday for a weekly habit" };
        }
        return { schedule: { kind: 'weekly', weekdays: uniqueSorted(weekdays) } };
    }

    if (frequency === 'monthly') {
        const monthDays = Array.isArray(input.monthDays) ? input.monthDays.filter(isMonthDay) : [];
        if (monthDays.length === 0) {
            return { error: "Pick at least one day of the month for a monthly habit" };
        }
        return { schedule: { kind: 'monthly', monthDays: uniqueSorted(monthDays) } };
    }

    const intervalDays = Number(input.intervalDays);
    if (!isIntervalDays(intervalDays)) {
        return { error: "Custom habits need an interval between 1 and 365 days" };
    }
    return { schedule: { kind: 'custom', intervalDays } };
};

export interface HabitScheduleFields {
    frequency: string;
    schedule: unknown;
    createdAt: Date;
}

// Reads the schedule stored on a habit row, ignoring malformed data.
export const scheduleOf = (habit: HabitScheduleFields): HabitSchedule => {
    const stored = habit.schedule;
    if (stored && typeof stored === 'object' && 'kind' in stored) {
        const candidate = stored as HabitSchedule;
        if (candidate.kind === 'daily') {
            return { kind: 'daily' };
        }
        if (candidate.kind === 'weekly' && Array.isArray(candidate.weekdays)) {
            const weekdays = candidate.weekdays.filter(isWeekday);
            if (weekdays.length > 0) {
                return { kind: 'weekly', weekdays: uniqueSorted(weekdays) };
            }
        }
        if (candidate.kind === 'monthly' && Array.isArray(candidate.monthDays)) {
            const monthDays = candidate.monthDays.filter(isMonthDay);
            if (monthDays.length > 0) {
                return { kind: 'monthly', monthDays: uniqueSorted(monthDays) };
            }
        }
        if (candidate.kind === 'custom' && isIntervalDays(candidate.intervalDays)) {
            return { kind: 'custom', intervalDays: candidate.intervalDays };
        }
    }

    // Rows predating schedules are backfilled by the migration; anything else
    // we cannot read behaves like a daily habit rather than disappearing.
    return { kind: 'daily' };
};

const utcTime = (dateKey: string): number => {
    const [year, month, day] = dateKey.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
};

const weekdayOfKey = (dateKey: string): number => new Date(utcTime(dateKey)).getUTCDay();

const daysInMonthOfKey = (dateKey: string): number => {
    const [year, month] = dateKey.split('-').map(Number);
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
};

const daysBetween = (fromKey: string, toKey: string): number =>
    Math.round((utcTime(toKey) - utcTime(fromKey)) / 86_400_000);

// Is this habit scheduled on that calendar day? `anchorKey` is the habit's
// start day, used to align "every N days" intervals.
export const isDueOn = (schedule: HabitSchedule, dateKey: string, anchorKey: string): boolean => {
    if (schedule.kind === 'daily') {
        return true;
    }

    if (schedule.kind === 'weekly') {
        return schedule.weekdays.includes(weekdayOfKey(dateKey));
    }

    if (schedule.kind === 'monthly') {
        const day = Number(dateKey.slice(8, 10));
        const lastDay = daysInMonthOfKey(dateKey);
        // A habit on the 31st is due on the last day of shorter months.
        return schedule.monthDays.some(monthDay => day === Math.min(monthDay, lastDay));
    }

    const elapsed = daysBetween(anchorKey, dateKey);
    return elapsed >= 0 && elapsed % schedule.intervalDays === 0;
};

