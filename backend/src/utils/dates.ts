export const DEFAULT_TIMEZONE = 'UTC';

export const isValidTimeZone = (value: unknown): value is string => {
    if (typeof value !== 'string') return false;
    const candidate = value.trim();
    if (!candidate) return false;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: candidate });
        return true;
    } catch {
        return false;
    }
};

export const normalizeTimeZone = (value: unknown): string =>
    isValidTimeZone(value) ? value.trim() : DEFAULT_TIMEZONE;

const keyFormatters = new Map<string, Intl.DateTimeFormat>();
const keyFormatterFor = (timeZone: string): Intl.DateTimeFormat => {
    let formatter = keyFormatters.get(timeZone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        keyFormatters.set(timeZone, formatter);
    }
    return formatter;
};

const offsetFormatters = new Map<string, Intl.DateTimeFormat>();
const offsetFormatterFor = (timeZone: string): Intl.DateTimeFormat => {
    let formatter = offsetFormatters.get(timeZone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            hourCycle: 'h23',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        offsetFormatters.set(timeZone, formatter);
    }
    return formatter;
};

const partsOf = (formatter: Intl.DateTimeFormat, date: Date): Record<string, string> => {
    const parts: Record<string, string> = {};
    for (const part of formatter.formatToParts(date)) {
        parts[part.type] = part.value;
    }
    return parts;
};

const parseKey = (dateKey: string) => {
    const [year = 0, month = 1, day = 1] = dateKey.split('-').map(Number);
    return { year, month, day };
};

// The calendar date (YYYY-MM-DD) the instant falls on in this user's zone.
export const toDateKey = (date: Date, timeZone: string): string => {
    const parts = partsOf(keyFormatterFor(timeZone), date);
    return `${parts.year}-${parts.month}-${parts.day}`;
};

// How far ahead of UTC the zone is at that instant, in milliseconds.
const offsetMs = (date: Date, timeZone: string): number => {
    const parts = partsOf(offsetFormatterFor(timeZone), date);
    const wallClock = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour) % 24,
        Number(parts.minute),
        Number(parts.second)
    );
    return wallClock - Math.floor(date.getTime() / 1000) * 1000;
};

export const addDays = (dateKey: string, days: number): string => {
    const { year, month, day } = parseKey(dateKey);
    return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
};

// The UTC instant at which `dateKey` starts in this zone. Two passes so a day
// that begins across a DST change still resolves to the real local midnight.
const startOfDay = (dateKey: string, timeZone: string): Date => {
    const { year, month, day } = parseKey(dateKey);
    const midnight = Date.UTC(year, month - 1, day);
    const firstPass = midnight - offsetMs(new Date(midnight), timeZone);
    return new Date(midnight - offsetMs(new Date(firstPass), timeZone));
};

// [start, end) of the local calendar day containing `date`, as UTC instants.
export const dayRange = (date: Date, timeZone: string) => {
    const key = toDateKey(date, timeZone);
    return {
        key,
        start: startOfDay(key, timeZone),
        end: startOfDay(addDays(key, 1), timeZone),
    };
};
