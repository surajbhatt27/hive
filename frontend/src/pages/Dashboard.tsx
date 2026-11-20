import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { spaceService, type DashboardSummary } from "../services/space";
import { habitService } from "../services/habit";

export default function Dashboard() {
    const { user, logout } = useAuth();
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
        return <div className="p-6">Loading dashboard...</div>;
    }

    const totals = summary?.totals;
    const spaces = summary?.spaces ?? [];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Hi, {user?.name}</h1>
                    <p className="text-sm">Here is where your habits stand today.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/spaces">Your spaces</Link>
                    <button onClick={logout}>Logout</button>
                </div>
            </div>

            {error && <div className="text-red-500">{error}</div>}

            <div className="flex gap-6">
                <div>
                    <div className="text-sm">Spaces</div>
                    <div className="text-xl">{totals?.spaces ?? 0}</div>
                </div>
                <div>
                    <div className="text-sm">Habits</div>
                    <div className="text-xl">{totals?.habits ?? 0}</div>
                </div>
                <div>
                    <div className="text-sm">Done today</div>
                    <div className="text-xl">
                        {totals?.completedToday ?? 0}/{totals?.dueToday ?? 0}
                    </div>
                </div>
            </div>

            {spaces.length === 0 ? (
                <div className="space-y-3">
                    <h2 className="text-lg">No spaces yet</h2>
                    <p>Create a space or open an invite link to join one.</p>
                    <div className="flex gap-2">
                        <Link to="/spaces/create">Create a space</Link>
                        <Link to="/spaces">Browse spaces</Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-lg">Today</h2>
                    {spaces.map(space => (
                        <div key={space.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Link to={`/spaces/${space.id}`} className="font-medium">{space.name}</Link>
                                    <div className="text-sm">
                                        {space.role} · {space.memberCount} member{space.memberCount === 1 ? '' : 's'} · {space.completedToday}/{space.dueToday} due today
                                    </div>
                                </div>
                                <Link to={`/spaces/${space.id}`}>Open</Link>
                            </div>

                            {space.habits.length === 0 ? (
                                <p className="text-sm">No habits in this space yet.</p>
                            ) : (
                                <ul className="space-y-1">
                                    {space.habits.map(habit => {
                                        const key = `${space.id}:${habit.id}`;
                                        return (
                                            <li key={habit.id} className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleHabit(space.id, habit.id, habit.completed)}
                                                    disabled={pending === key || !habit.due}
                                                    title={habit.due ? undefined : 'Not scheduled today'}
                                                >
                                                    {habit.completed ? '✓' : '○'}
                                                </button>
                                                <span>
                                                    {habit.name}
                                                    {habit.type === 'space' && <span className="text-sm"> [Space]</span>}
                                                    {habit.type === 'personal' && <span className="text-sm"> [Personal]</span>}
                                                    {!habit.due && <span className="text-sm"> (not due today)</span>}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
