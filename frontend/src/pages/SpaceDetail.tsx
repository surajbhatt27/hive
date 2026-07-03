import { useEffect, useState } from "react";
import { useSpaces } from "../context/SpaceContext";
import { useNavigate, useParams } from "react-router-dom";
import type { Space } from "../services/space";

export default function SpaceDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getSpace, deleteSpace, updateSpace } = useSpaces();
    
    const [space, setSpace] = useState<Space | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");

    useEffect(() => {
        if(id) {
            loadSpace(parseInt(id))
        }
    },[])

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
    }

    const handleDelete = async () => {
        if(!space) return
        if(window.confirm(`Delete "${space.name}"? This will delete all habits and logs in this space.`))
        try {
            await deleteSpace(space.id);
            navigate('/spaces');
        } catch (error: any) {
            setError(error.message || "Failed to delete space");
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!space) return;

        try {
            const updated = await updateSpace(space.id, {
                name: editName.trim(),
                description: editDescription.trim() || undefined
            })
            setSpace(updated);
            setIsEditing(false);
        } catch (error: any) {
            setError(error.message || "Failed to update space");
        }
    }

    if (loading) {
        return <div>Loading space...</div>;
    }

    if (!space) {
        return (
            <div>
                <p>Space not found</p>
                <button onClick={() => navigate('/spaces')}>
                    Back to Spaces
                </button>
            </div>
        );
    }

    const isAdmin = space.role === 'admin';

    return (
        <div>
            {error && (
                <div>
                    {error}
                </div>
            )}

            <div>
                <div>
                    {isEditing ? (
                        <form onSubmit={handleUpdate}>
                            <div>
                                <label htmlFor="editName">Name</label>
                                <input
                                    id="editName"
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="editDescription">Description</label>
                                <textarea
                                    id="editDescription"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div>
                                <button type="submit">Save</button>
                                <button type="button" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <h1>{space.name}</h1>
                            {space.description && <p>{space.description}</p>}
                            <div>
                                <span>{space.role}</span>
                                <span>Slug: {space.slug}</span>
                            </div>
                        </>
                    )}
                </div>

                {isAdmin && !isEditing && (
                    <div>
                        <button onClick={() => setIsEditing(true)}>
                            Edit
                        </button>
                        <button onClick={handleDelete}>
                            Delete
                        </button>
                    </div>
                )}
            </div>

            <div>
                <p>Habits coming soon...</p>
            </div>
        </div>
    )
}
