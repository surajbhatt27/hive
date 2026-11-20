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
        return <div className="p-6">Loading habit...</div>;
    }

    if (!habit) {
        return (
            <div className="p-6 space-y-3">
                <h1 className="text-2xl font-semibold">Habit not found</h1>
                <p>{error || "This habit no longer exists."}</p>
                <Link to={spaceId ? `/spaces/${spaceId}` : "/spaces"}>Back to space</Link>
            </div>
        );
    }

    const recentLogs = (history?.logs ?? []).slice(0, 30);
    const streak = history?.streak ?? 0;
    const due = habit.dueToday !== false;

    return (
        <div className="p-6 space-y-6">
            <div className="space-y-1">
                <Link to={`/spaces/${spaceId}`} className="text-sm">← Back to space</Link>
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold">{habit.name}</h1>
                    <span className="text-sm">
                        [{habit.type === 'space' ? 'Space' : 'Personal'}]
                    </span>
                </div>
                {habit.description && <p>{habit.description}</p>}
                <div className="flex flex-wrap gap-4 text-sm">
                    <span>Schedule: {describeSchedule(habit.schedule, habit.frequency)}</span>
                    <span>Streak: {streak} day{streak === 1 ? '' : 's'}</span>
                    <span>Done in last {HISTORY_DAYS} days: {completedCount}</span>
                    <span>
                        Last completed: {history?.lastCompletedAt
                            ? new Date(history.lastCompletedAt).toLocaleDateString()
                            : 'never'}
                    </span>
                </div>
            </div>

            {error && <div className="text-red-500">{error}</div>}

            <div>
                <button onClick={handleToggle} disabled={busy || !due}>
                    {!due
                        ? 'Not due today'
                        : habit.completedToday ? '✓ Done today (undo)' : 'Mark done today'}
                </button>
            </div>

            <hr />

            <div className="space-y-2">
                <h2 className="text-lg">Last {HISTORY_DAYS} days</h2>
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
                                className={`h-4 w-4 rounded-sm ${log ? 'bg-emerald-500' : 'bg-neutral-700'}`}
                            />
                        );
                    })}
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-sm bg-neutral-700" /> Not done
                    <span className="ml-3 h-3 w-3 rounded-sm bg-emerald-500" /> Done
                </div>
            </div>

            <hr />

            <form onSubmit={handleSaveNote} className="space-y-2 max-w-lg">
                <h2 className="text-lg">Today's note</h2>
                <textarea
                    value={note}
                    onChange={event => {
                        setNote(event.target.value);
                        setNoteStatus("");
                    }}
                    rows={2}
                    maxLength={500}
                    placeholder={due ? "How did it go?" : "This habit is not scheduled today"}
                    disabled={busy || !due}
                    className="w-full rounded border border-neutral-600 bg-transparent p-2 text-sm"
                />
                <div className="flex items-center gap-3">
                    <button type="submit" disabled={busy || !due}>Save note</button>
                    {due && !habit.completedToday && (
                        <span className="text-sm">Saving a note also marks today done.</span>
                    )}
                    {noteStatus && <span className="text-sm">{noteStatus}</span>}
                </div>
            </form>

            <hr />

            <div className="space-y-2">
                <h2 className="text-lg">Recent check-ins</h2>
                {recentLogs.length === 0 ? (
                    <p className="text-sm">No check-ins in the last {HISTORY_DAYS} days.</p>
                ) : (
                    <ul className="space-y-2">
                        {recentLogs.map(log => (
                            <li key={log.id} className="border-b border-neutral-800 pb-1">
                                <div className="flex items-center justify-between gap-3">
                                    <span>
                                        {logDateKey(log.logDate)}
                                        {habit.type === 'space' && (
                                            <span className="text-sm"> · {log.userName}</span>
                                        )}
                                    </span>
                                    <span className="text-sm">
                                        {new Date(log.completedAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                {log.note && <p className="text-sm">{log.note}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
