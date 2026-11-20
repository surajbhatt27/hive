import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { spaceService, type DashboardSummary } from "../services/space";
import { habitService } from "../services/habit";

const todayLabel = () =>
    new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

export default function Dashboard() {
    const { user } = useAuth();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pending, setPending] = useState<string | null>(null);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const response = await spaceService.getSummary();
            setSummary(response.data.data);
            setError("");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load your dashboard");
        } finally {
            setLoading(false);
        }
    };

    const toggleHabit = async (spaceId: number, habitId: number, completed: boolean) => {
        const key = `${spaceId}:${habitId}`;
        setPending(key);
        setError("");
        try {
            if (completed) {
                await habitService.undoCompletion(spaceId, habitId);
            } else {
                await habitService.complete(spaceId, habitId);
            }
            await load();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update habit");
        } finally {
            setPending(null);
        }
    };

    if (loading) {
        return <p className="eyebrow animate-pulse">Gathering today…</p>;
    }

    const totals = summary?.totals;
    const spaces = summary?.spaces ?? [];
    const due = totals?.dueToday ?? 0;
    const done = totals?.completedToday ?? 0;
    const left = Math.max(due - done, 0);
    const firstName = user?.name?.split(" ")[0] ?? "there";

    const summaryLine = due === 0
        ? "Nothing is scheduled for today."
        : left === 0
            ? "Everything due today is done."
            : `${left} habit${left === 1 ? "" : "s"} left of ${due} due today.`;

    return (
        <div className="space-y-10">
            <header className="space-y-2">
                <p className="eyebrow">{todayLabel()}</p>
                <h1>Hi, {firstName}.</h1>
                <p className="text-sm">{summaryLine}</p>
            </header>

            {error && <p className="alert">{error}</p>}

            <div className="grid grid-cols-3 divide-x divide-line border-y border-line">
                {[
                    { label: "Spaces", value: String(totals?.spaces ?? 0) },
                    { label: "Habits", value: String(totals?.habits ?? 0) },
                    { label: "Done today", value: `${done}/${due}` },
                ].map(stat => (
                    <div key={stat.label} className="px-4 py-4 first:pl-0">
                        <div className="eyebrow">{stat.label}</div>
                        <div className="font-display text-2xl text-ink tabular-nums">{stat.value}</div>
                    </div>
                ))}
            </div>

            {spaces.length === 0 ? (
                <div className="empty">
                    <h2 className="mb-1">No spaces yet</h2>
                    <p className="mx-auto mb-5 max-w-sm text-sm">
                        A space keeps a set of habits together. Start one, or open an invite link
                        someone sent you.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        <Link to="/spaces/create" className="btn btn-primary">Create a space</Link>
                        <Link to="/spaces" className="btn">See my spaces</Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {spaces.map(space => (
                        <section key={space.id} className="space-y-3">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <div>
                                    <h2>
                                        <Link to={`/spaces/${space.id}`} className="text-ink no-underline">
                                            {space.name}
                                        </Link>
                                    </h2>
                                    <p className="text-sm">
                                        {space.role} · {space.memberCount} member{space.memberCount === 1 ? "" : "s"} ·{" "}
                                        <span className="tabular-nums">{space.completedToday}/{space.dueToday}</span> due today
                                    </p>
                                </div>
                                <Link to={`/spaces/${space.id}`} className="text-sm">Open →</Link>
                            </div>

                            {space.habits.length === 0 ? (
                                <p className="border-t border-line py-3 text-sm">
                                    No habits here yet.
                                </p>
                            ) : (
                                <ul className="divide-y divide-line border-t border-line">
                                    {space.habits.map(habit => {
                                        const key = `${space.id}:${habit.id}`;
                                        return (
                                            <li key={habit.id} className="flex items-center gap-3 py-2.5">
                                                <button
                                                    className={`check${habit.completed ? " check-done" : ""}`}
                                                    onClick={() => toggleHabit(space.id, habit.id, habit.completed)}
                                                    disabled={pending === key || !habit.due}
                                                    title={habit.due ? undefined : "Not scheduled today"}
                                                    aria-label={
                                                        habit.completed
                                                            ? `Mark ${habit.name} as not done`
                                                            : `Mark ${habit.name} as done`
                                                    }
                                                >
                                                    {habit.completed ? "✓" : ""}
                                                </button>
                                                <span className={`flex-1 ${habit.due ? "" : "text-faint"}`}>
                                                    {habit.name}
                                                </span>
                                                <span className="tag">
                                                    {habit.type === "space" ? "Space" : "Personal"}
                                                </span>
                                                {!habit.due && (
                                                    <span className="text-xs text-faint">not today</span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
