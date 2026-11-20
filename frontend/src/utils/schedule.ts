import type { Frequency, HabitSchedule, SchedulePayload } from "../services/habit";

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface ScheduleDraft {
    frequency: Frequency;
    weekdays: number[];
    monthDaysText: string;
    intervalDays: number;
}

export const emptyScheduleDraft = (): ScheduleDraft => ({
    frequency: 'daily',
    weekdays: [],
    monthDaysText: '',
    intervalDays: 2,
});

export const draftFromHabit = (habit: {
    frequency: Frequency;
    schedule?: HabitSchedule | null;
}): ScheduleDraft => {
    const draft = emptyScheduleDraft();
    draft.frequency = habit.frequency;

    const schedule = habit.schedule;
    if (schedule?.kind === 'weekly') {
        draft.weekdays = schedule.weekdays;
    } else if (schedule?.kind === 'monthly') {
        draft.monthDaysText = schedule.monthDays.join(', ');
    } else if (schedule?.kind === 'custom') {
        draft.intervalDays = schedule.intervalDays;
    }

    return draft;
};

export const parseMonthDays = (text: string): number[] => {
    const days = text
        .split(/[^0-9]+/)
        .filter(Boolean)
        .map(Number)
        .filter(day => Number.isInteger(day) && day >= 1 && day <= 31);
    return [...new Set(days)].sort((a, b) => a - b);
};

export const schedulePayload = (draft: ScheduleDraft): Required<Pick<SchedulePayload, 'frequency'>> & SchedulePayload => {
    if (draft.frequency === 'weekly') {
        return { frequency: 'weekly', weekdays: draft.weekdays };
    }
    if (draft.frequency === 'monthly') {
        return { frequency: 'monthly', monthDays: parseMonthDays(draft.monthDaysText) };
    }
    if (draft.frequency === 'custom') {
        return { frequency: 'custom', intervalDays: draft.intervalDays };
    }
    return { frequency: 'daily' };
};

export const scheduleError = (draft: ScheduleDraft): string => {
    if (draft.frequency === 'weekly' && draft.weekdays.length === 0) {
        return 'Pick at least one weekday';
    }
    if (draft.frequency === 'monthly' && parseMonthDays(draft.monthDaysText).length === 0) {
        return 'Pick at least one day of the month (1–31)';
    }
    if (
        draft.frequency === 'custom' &&
        (!Number.isInteger(draft.intervalDays) || draft.intervalDays < 1 || draft.intervalDays > 365)
    ) {
        return 'Interval must be between 1 and 365 days';
    }
    return '';
};

export const describeSchedule = (schedule?: HabitSchedule | null, frequency?: Frequency): string => {
    if (!schedule) {
        return frequency ?? 'daily';
    }
    if (schedule.kind === 'daily') {
        return 'Every day';
    }
    if (schedule.kind === 'weekly') {
        if (schedule.weekdays.length === 7) return 'Every day';
        return schedule.weekdays.map(day => WEEKDAY_LABELS[day]).join(', ');
    }
    if (schedule.kind === 'monthly') {
        return `Day${schedule.monthDays.length === 1 ? '' : 's'} ${schedule.monthDays.join(', ')} of the month`;
    }
    return schedule.intervalDays === 1 ? 'Every day' : `Every ${schedule.intervalDays} days`;
};
