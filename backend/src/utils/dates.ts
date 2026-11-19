const DAY_MS = 24 * 60 * 60 * 1000;

// Habit completions are tracked per calendar day (UTC) so a habit can only be
// completed once a day regardless of how many times the user clicks.
export const startOfUtcDay = (date: Date = new Date()): Date =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

export const endOfUtcDay = (date: Date = new Date()): Date =>
    new Date(startOfUtcDay(date).getTime() + DAY_MS);

export const toUtcDateKey = (date: Date): string =>
    startOfUtcDay(date).toISOString().slice(0, 10);

export const daysAgo = (days: number, from: Date = new Date()): Date =>
    new Date(startOfUtcDay(from).getTime() - days * DAY_MS);
