import { useState } from "react";
import { useSpaces } from "../context/SpaceContext";
import { useNavigate } from "react-router-dom";

export default function CreateSpace() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const { createSpace } = useSpaces();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!name.trim()) {
            setError("Name is required");
            return
        }
        setIsSubmitting(true);
        setError("");
        try {
            await createSpace({
                name: name.trim(),
                description: description.trim() || undefined
            });
            navigate('/spaces');
        } catch (error: any) {
            setError(error.message || "Failed to create space");
        } finally {
            setIsSubmitting(false);
        }
    }
    return (
        <div className="mx-auto max-w-lg space-y-6">
            <header className="space-y-1">
                <p className="eyebrow">New space</p>
                <h1>Create a space</h1>
                <p className="text-sm">
                    A space is where you keep related habits — your own, or shared with the people
                    you invite.
                </p>
            </header>

            <form onSubmit={handleSubmit} className="card space-y-5 p-6">
                {error && (
                    <p className="rounded-md border border-clay/40 bg-clay-soft px-3 py-2 text-sm text-clay">
                        {error}
                    </p>
                )}

                <div>
                    <label htmlFor="name">Space name <span className="text-clay">*</span></label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Personal, Work, Book club"
                        required
                        disabled={isSubmitting}
                    />
                    <p className="hint">A unique invite link is created from this name.</p>
                </div>

                <div>
                    <label htmlFor="description">Description (optional)</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What is this space for?"
                        rows={3}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="flex items-center gap-2 pt-1">
                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? "Creating…" : "Create space"}
                    </button>
                    <button
                        type="button"
                        className="btn-quiet"
                        onClick={() => navigate('/spaces')}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
