import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { habitService, type Habit, type HabitHistory, type HabitLog } from "../services/habit";
import { describeSchedule } from "../utils/schedule";

const HISTORY_DAYS = 90;

const dateKey = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const logDateKey = (value: HabitLog["logDate"]): string => String(value).slice(0, 10);

export default function HabitDetail() {
    const { spaceId: spaceIdParam, habitId: habitIdParam } = useParams<{ spaceId: string; habitId: string }>();
    const spaceId = Number(spaceIdParam);
    const habitId = Number(habitIdParam);
    const { user } = useAuth();

    const [habit, setHabit] = useState<Habit | null>(null);
    const [history, setHistory] = useState<HabitHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState("");
    const [noteStatus, setNoteStatus] = useState("");

    const load = useCallback(async (showSpinner = true) => {
        if (!spaceId || !habitId) {
            setError("This habit link is invalid.");
            setLoading(false);
            return;
        }
        if (showSpinner) setLoading(true);
        try {
            const [habitResponse, historyResponse] = await Promise.all([
                habitService.getById(spaceId, habitId),
                habitService.getHistory(spaceId, habitId),
            ]);
            setHabit(habitResponse.data.data);
            setHistory(historyResponse.data.data);
            setError("");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load this habit");
        } finally {
            setLoading(false);
        }
    }, [spaceId, habitId]);

    useEffect(() => {
        load();
    }, [load]);

    const todayKey = dateKey(new Date());

    // The history endpoint returns the last 90 days; for space habits it also
    // includes other members, so the heatmap and note box only look at my rows.
    const completedDays = useMemo(() => {
        const map = new Map<string, HabitLog>();
        for (const log of history?.logs ?? []) {
            if (log.userId === user?.id) map.set(logDateKey(log.logDate), log);
        }
        return map;
    }, [history, user?.id]);

    const todayLog = completedDays.get(todayKey) ?? null;

    useEffect(() => {
        setNote(todayLog?.note ?? "");
    }, [todayLog?.id, todayLog?.note]);

    const days = useMemo(() => {
        const [year, month, day] = todayKey.split('-').map(Number);
        return Array.from({ length: HISTORY_DAYS }, (_, index) => {
            const date = new Date(year, month - 1, day - (HISTORY_DAYS - 1 - index));
            return { date, key: dateKey(date) };
        });
    }, [todayKey]);

    const leadingBlanks = days[0].date.getDay();
    const completedCount = days.filter(day => completedDays.has(day.key)).length;

    const handleToggle = async () => {
        if (!habit) return;
        setBusy(true);
        setError("");
        setNoteStatus("");
        try {
            if (habit.completedToday) {
                await habitService.undoCompletion(spaceId, habitId);
            } else {
                // Keep a note the user typed before clicking "Mark done today".
                await habitService.complete(spaceId, habitId, note.trim());
            }
            await load(false);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update this habit");
        } finally {
            setBusy(false);
        }
    };

    const handleSaveNote = async (event: React.FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        setNoteStatus("");
        const trimmed = note.trim();
        try {
            // Notes are stored on today's check-in, so saving one logs today.
            await habitService.complete(spaceId, habitId, trimmed);
            setNoteStatus(trimmed ? "Note saved." : "Note cleared.");
            await load(false);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to save your note");
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return <p className="eyebrow animate-pulse">Loading habit…</p>;
    }

    if (!habit) {
        return (
            <div className="space-y-3">
                <h1>Habit not found</h1>
                <p>{error || "This habit no longer exists."}</p>
                <Link to={spaceId ? `/spaces/${spaceId}` : "/spaces"}>Back to space</Link>
            </div>
        );
    }

    const recentLogs = (history?.logs ?? []).slice(0, 30);
    const streak = history?.streak ?? 0;
    const due = habit.dueToday !== false;

    return (
        <div className="space-y-8">
            <header className="space-y-3">
                <Link to={`/spaces/${spaceId}`} className="inline-block text-sm">← Back to space</Link>
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1>{habit.name}</h1>
                        <span className="tag">{habit.type === 'space' ? 'Space' : 'Personal'}</span>
                        {!due && <span className="tag">not due today</span>}
                    </div>
                    {habit.description && <p className="max-w-prose">{habit.description}</p>}
                </div>

                <dl className="flex flex-wrap gap-x-8 gap-y-3 border-y border-line py-3 text-sm">
                    <div>
                        <dt className="eyebrow">Schedule</dt>
                        <dd>{describeSchedule(habit.schedule, habit.frequency)}</dd>
                    </div>
                    <div>
                        <dt className="eyebrow">Streak</dt>
                        <dd className="tabular-nums">{streak} day{streak === 1 ? '' : 's'}</dd>
                    </div>
                    <div>
                        <dt className="eyebrow">Last {HISTORY_DAYS} days</dt>
                        <dd className="tabular-nums">{completedCount} done</dd>
                    </div>
                    <div>
                        <dt className="eyebrow">Last completed</dt>
                        <dd>
                            {history?.lastCompletedAt
                                ? new Date(history.lastCompletedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
                                : 'never'}
                        </dd>
                    </div>
                </dl>
            </header>

            {error && <p className="alert">{error}</p>}

            <div className="flex flex-wrap items-center gap-3">
                <button
                    className={habit.completedToday ? "" : "btn-primary"}
                    onClick={handleToggle}
                    disabled={busy || !due}
                >
                    {!due
                        ? 'Not scheduled today'
                        : habit.completedToday ? '✓ Done today — undo' : 'Mark done today'}
                </button>
                {!habit.completedToday && due && (
                    <span className="text-sm text-faint">One tap and it's logged for today.</span>
                )}
            </div>

            <section className="space-y-3">
                <h2>Last {HISTORY_DAYS} days</h2>
                <div
                    className="grid gap-1"
                    style={{
                        gridTemplateRows: 'repeat(7, 1rem)',
                        gridAutoFlow: 'column',
                        gridAutoColumns: '1rem',
                        width: 'max-content',
                    }}
                >
                    {Array.from({ length: leadingBlanks }).map((_, index) => (
                        <div key={`blank-${index}`} />
                    ))}
                    {days.map(day => {
                        const log = completedDays.get(day.key);
                        return (
                            <div
                                key={day.key}
                                title={`${day.key}${log?.note ? ` — ${log.note}` : ''}${log ? '' : ' — not completed'}`}
                                className={`h-4 w-4 rounded-[3px] ${log ? 'bg-moss' : 'bg-line'}`}
                            />
                        );
                    })}
                </div>
                <div className="flex items-center gap-4 text-xs text-faint">
                    <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-[3px] bg-line" /> not done
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-[3px] bg-moss" /> done
                    </span>
                </div>
            </section>

            <section className="card max-w-lg space-y-3 p-5">
                <div>
                    <h2 className="mb-0.5">Today's note</h2>
                    <p className="text-sm">
                        {due ? "A line about how it went." : "This habit isn't scheduled today."}
                    </p>
                </div>
                <form onSubmit={handleSaveNote} className="space-y-3">
                    <textarea
                        value={note}
                        onChange={event => {
                            setNote(event.target.value);
                            setNoteStatus("");
                        }}
                        rows={2}
                        maxLength={500}
                        placeholder={due ? "How did it go?" : "Nothing to write today"}
                        disabled={busy || !due}
                        aria-label="Today's note"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                        <button type="submit" disabled={busy || !due}>Save note</button>
                        {due && !habit.completedToday && (
                            <span className="text-sm text-faint">Saving a note also marks today done.</span>
                        )}
                        {noteStatus && <span className="text-sm text-moss">{noteStatus}</span>}
                    </div>
                </form>
            </section>

            <section className="space-y-3">
                <h2>Recent check-ins</h2>
                {recentLogs.length === 0 ? (
                    <p className="text-sm">Nothing logged in the last {HISTORY_DAYS} days.</p>
                ) : (
                    <ul className="divide-y divide-line border-y border-line">
                        {recentLogs.map(log => (
                            <li key={log.id} className="py-2.5">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm">
                                        {new Date(`${logDateKey(log.logDate)}T00:00:00`).toLocaleDateString(undefined, {
                                            day: 'numeric',
                                            month: 'short',
                                            weekday: 'short',
                                        })}
                                        {habit.type === 'space' && (
                                            <span className="text-faint"> · {log.userName}</span>
                                        )}
                                    </span>
                                    <span className="text-xs text-faint tabular-nums">
                                        {new Date(log.completedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {log.note && <p className="mt-0.5 text-sm text-muted">{log.note}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
