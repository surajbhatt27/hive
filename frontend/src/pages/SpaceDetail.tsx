import { useEffect, useState } from "react";
import { useSpaces } from "../context/SpaceContext";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HabitProvider, useHabits } from "../context/HabitContext";
import type { Space } from "../services/space";
import { HabitCard } from "../components/HabitCard";
import { CreateHabitModal } from "../components/CreateHabitModal";
import { EditHabitModal } from "../components/EditHabitModal";
import type { CreateHabitData, Habit, UpdateHabitData } from "../services/habit";
import { memberService } from "../services/member";

function SpaceDetailContent() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getSpace, deleteSpace, updateSpace, fetchSpaces } = useSpaces();
    const { habits, loading: habitsLoading, fetchHabits, createHabit, updateHabit, deleteHabit, toggleHabit } = useHabits();
    
    const [space, setSpace] = useState<Space | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'space' | 'personal'>('all');

    useEffect(() => {
        if(id) {
            loadSpace(parseInt(id));
            loadHabits(parseInt(id));
        }
    }, [id]);

    const loadSpace = async (spaceId: number) => {
        try {
            setLoading(true);
            const data = await getSpace(spaceId);
            setSpace(data);
            setEditName(data.name);
            setEditDescription(data.description || "");
        } catch (error: any) {
            setError(error.message || "Failed to load space");
        } finally {
            setLoading(false);
        }
    };

    const loadHabits = async (spaceId: number) => {
        try {
            await fetchHabits(spaceId);
        } catch (error) {
            console.error("Failed to load habits:", error);
        }
    };

    const handleDelete = async () => {
        if(!space) return;
        if(window.confirm(`Delete "${space.name}"? This will delete all habits and logs in this space.`)) {
            try {
                await deleteSpace(space.id);
                navigate('/spaces');
            } catch (error: any) {
                setError(error.message || "Failed to delete space");
            }
        }
    };

    // Members leave through the same endpoint admins use to remove people; the
    // backend allows self-removal and keeps check-in history intact.
    const handleLeave = async () => {
        if (!space || !user) return;
        if (!window.confirm(`Leave "${space.name}"? You'll need an invite to rejoin.`)) return;
        try {
            await memberService.remove(space.id, user.id);
            await fetchSpaces();
            navigate('/spaces');
        } catch (error: any) {
            setError(error.response?.data?.message || error.message || "Failed to leave space");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!space) return;

        try {
            const updated = await updateSpace(space.id, {
                name: editName.trim(),
                description: editDescription.trim() || undefined
            });
            setSpace(updated);
            setIsEditing(false);
        } catch (error: any) {
            setError(error.message || "Failed to update space");
        }
    };

    const handleCreateHabit = async (data: CreateHabitData) => {
        if (!space) return;
        await createHabit(space.id, data);
    };

    const handleUpdateHabit = async (data: UpdateHabitData) => {
        if (!space || !editingHabit) return;
        await updateHabit(space.id, editingHabit.id, data);
        setEditingHabit(null);
    };

    const handleDeleteHabit = async (habitId: number) => {
        if (!space) return;
        if (!window.confirm("Delete this habit?")) return;
        try {
            await deleteHabit(space.id, habitId);
        } catch (err: any) {
            setError(err.message || "Failed to delete habit");
        }
    };
    

    const handleEditHabit = (habit: Habit) => {
        setEditingHabit(habit);
        setShowEditModal(true);
    };

    const handleToggleHabit = async (habit: Habit) => {
        if (!space) return;
        try {
            await toggleHabit(space.id, habit);
        } catch (err: any) {
            setError(err.message || "Failed to update habit");
        }
    };

    const getFilteredHabits = () => {
        if (filterType === 'all') return habits;
        return habits.filter(h => h.type === filterType);
    };

    if (loading) {
        return <p className="eyebrow animate-pulse">Opening space…</p>;
    }

    if (!space) {
        return (
            <div className="space-y-3">
                <p>Space not found</p>
                <button onClick={() => navigate('/spaces')}>Back to spaces</button>
            </div>
        );
    }

    const isAdmin = space.role === 'admin';
    const filteredHabits = getFilteredHabits();

    return (
        <div className="space-y-8">
            <header className="space-y-4">
                <Link to="/spaces" className="inline-block text-sm">← All spaces</Link>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <p className="eyebrow">
                            {isAdmin ? 'Admin' : 'Member'} · started {new Date(space.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </p>
                        <h1>{space.name}</h1>
                        {space.description && <p className="max-w-prose">{space.description}</p>}
                    </div>

                    {!isEditing && (
                        <div className="flex flex-wrap items-center gap-2">
                            <button onClick={() => navigate(`/spaces/${space.id}/members`)}>
                                Members
                            </button>
                            {isAdmin && (
                                <button onClick={() => setIsEditing(true)}>Edit</button>
                            )}
                            {isAdmin ? (
                                <button className="btn-danger" onClick={handleDelete}>Delete</button>
                            ) : (
                                <button className="btn-quiet" onClick={handleLeave}>Leave space</button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {error && (
                <div className="alert flex items-start justify-between gap-3">
                    <span>{error}</span>
                    <button className="btn-quiet px-1 py-0 text-clay" onClick={() => setError('')}>✕</button>
                </div>
            )}

            {isEditing && (
                <form onSubmit={handleUpdate} className="card max-w-lg space-y-4 p-5">
                    <h2>Edit space</h2>
                    <div>
                        <label htmlFor="space-name">Name <span className="text-clay">*</span></label>
                        <input
                            id="space-name"
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="space-description">Description</label>
                        <textarea
                            id="space-description"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="submit" className="btn-primary">Save changes</button>
                        <button type="button" className="btn-quiet" onClick={() => setIsEditing(false)}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <section className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="space-y-1">
                        <h2>Habits</h2>
                        <p className="text-sm">
                            {isAdmin
                                ? 'Space habits are shared by everyone here; personal ones are only yours.'
                                : 'Track your own habits alongside the space ones.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as 'all' | 'space' | 'personal')}
                            className="w-auto shrink-0"
                            aria-label="Filter habits"
                        >
                            <option value="all">All habits</option>
                            <option value="space">Space habits</option>
                            <option value="personal">My habits</option>
                        </select>
                        <button
                            className="btn-primary whitespace-nowrap"
                            onClick={() => setShowCreateModal(true)}
                        >
                            + New habit
                        </button>
                    </div>
                </div>

                {habitsLoading ? (
                    <p className="eyebrow animate-pulse">Loading habits…</p>
                ) : filteredHabits.length === 0 ? (
                    <div className="empty">
                        <h3 className="mb-1">No habits here yet</h3>
                        <p className="mx-auto mb-5 max-w-sm text-sm">
                            {isAdmin
                                ? 'Create a habit for everyone in this space, or a personal one just for you.'
                                : 'Create a personal habit and it will show up here every day it is due.'}
                        </p>
                        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                            Create a habit
                        </button>
                    </div>
                ) : (
                    <ul className="divide-y divide-line border-y border-line">
                        {filteredHabits.map((habit) => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                currentUserId={user?.id || 0}
                                isAdmin={isAdmin}
                                onEdit={handleEditHabit}
                                onDelete={handleDeleteHabit}
                                onToggle={handleToggleHabit}
                            />
                        ))}
                    </ul>
                )}
            </section>

            <CreateHabitModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateHabit}
                isAdmin={isAdmin}
            />

            <EditHabitModal
                isOpen={showEditModal}
                habit={editingHabit}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingHabit(null);
                }}
                onSubmit={handleUpdateHabit}
            />
        </div>
    );
}

export default function SpaceDetail() {
    return (
        <HabitProvider>
            <SpaceDetailContent />
        </HabitProvider>
    );
}
