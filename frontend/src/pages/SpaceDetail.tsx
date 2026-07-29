import { useEffect, useState } from "react";
import { useSpaces } from "../context/SpaceContext";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HabitProvider, useHabits } from "../context/HabitContext";
import type { Space } from "../services/space";
import { HabitCard } from "../components/HabitCard";
import { CreateHabitModal } from "../components/CreateHabitModal";
import { EditHabitModal } from "../components/EditHabitModal";
import type { Habit } from "../services/habit";

function SpaceDetailContent() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getSpace, deleteSpace, updateSpace } = useSpaces();
    const { habits, loading: habitsLoading, fetchHabits, createHabit, updateHabit, deleteHabit } = useHabits();
    
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

    type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';

    const handleCreateHabit = async (data: { name: string; description?: string; type: 'space' | 'personal'; frequency: Frequency }) => {
        if (!space) return;
        await createHabit(space.id, data);
        await loadHabits(space.id);
    };

    const handleUpdateHabit = async (data: { name: string; description?: string; frequency: 'daily' | 'weekly' | 'monthly' | 'custom' }) => {
    if (!space || !editingHabit) return;
    await updateHabit(space.id, editingHabit.id, data);
    await loadHabits(space.id);
    setEditingHabit(null);
};

    const handleDeleteHabit = async (habitId: number) => {
        if (!space) return;
        if (window.confirm("Delete this habit?")) {
            await deleteHabit(space.id, habitId);
            await loadHabits(space.id);
        }
    };

    const handleEditHabit = (habit: Habit) => {
        setEditingHabit(habit);
        setShowEditModal(true);
    };

    const getFilteredHabits = () => {
        if (filterType === 'all') return habits;
        return habits.filter(h => h.type === filterType);
    };

    if (loading) {
        return <div>Loading space...</div>;
    }

    if (!space) {
        return (
            <div>
                <p>Space not found</p>
                <button onClick={() => navigate('/spaces')}>Back to Spaces</button>
            </div>
        );
    }

    const isAdmin = space.role === 'admin';
    const filteredHabits = getFilteredHabits();

    return (
        <div>
            {error && (
                <div>
                    {error}
                    <button onClick={() => setError('')}>✕</button>
                </div>
            )}

            {/* Space Details */}
            <div>
                <div>
                    <h1>{space.name}</h1>
                    {space.description && <p>{space.description}</p>}
                    <div>
                        <span>Role: {space.role}</span>
                        <span>Slug: {space.slug}</span>
                        <span>Created: {new Date(space.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                
                {/* Space Actions - Only visible when NOT editing */}
                {!isEditing && (
                    <div>
                        {isAdmin && (
                            <>
                                <button onClick={() => setIsEditing(true)}>Edit Space</button>
                                <button onClick={handleDelete}>Delete Space</button>
                            </>
                        )}
                        <button onClick={() => navigate('/spaces')}>Back to Spaces</button>
                    </div>
                )}
            </div>

            {/* Edit Space Form */}
            {isEditing && (
                <form onSubmit={handleUpdate}>
                    <h3>Edit Space</h3>
                    <div>
                        <label>Name *</label>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Description</label>
                        <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div>
                        <button type="submit">Save Changes</button>
                        <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
                    </div>
                </form>
            )}

            <hr />

            {/* Habits Section */}
            <div>
                <div>
                    <h2>Habits</h2>
                    <div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as 'all' | 'space' | 'personal')}
                        >
                            <option value="all">All Habits</option>
                            <option value="space">Space Habits</option>
                            <option value="personal">My Personal Habits</option>
                        </select>
                        <button onClick={() => setShowCreateModal(true)}>
                            + New Habit
                        </button>
                    </div>
                </div>

                {habitsLoading ? (
                    <div>Loading habits...</div>
                ) : filteredHabits.length === 0 ? (
                    <div>
                        <p>No habits yet in this space</p>
                        <p>
                            {isAdmin 
                                ? 'As an admin, you can create space habits for all members or personal habits for yourself'
                                : 'Create a personal habit to start tracking your progress'}
                        </p>
                        <button onClick={() => setShowCreateModal(true)}>
                            Create Your First Habit
                        </button>
                    </div>
                ) : (
                    <div>
                        {filteredHabits.map((habit) => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                currentUserId={user?.id || 0}
                                isAdmin={isAdmin}
                                onEdit={handleEditHabit}
                                onDelete={handleDeleteHabit}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Habit Modal */}
            <CreateHabitModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateHabit}
                isAdmin={isAdmin}
            />

            {/* Edit Habit Modal */}
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