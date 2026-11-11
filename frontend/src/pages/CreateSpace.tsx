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
        <div>
            <div>
                <h1>Create New Space</h1>
                <p>A space is where you'll group related habits</p>
            </div>
            <form onSubmit={handleSubmit}>
                {error && (
                    <div>
                        {error}
                    </div>
                )}
                <div>
                    <label htmlFor="name">Space Name <span>*</span></label>
                    <input 
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Personal, Work, Book Club"
                    required
                    disabled={isSubmitting}
                    />
                    <p>This will be used to generate a unique invite link</p>
                </div>

                <div>
                    <label htmlFor="description">
                        Description (optional)
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What is this space for?"
                        rows={4}
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting? "Creating" : "Create space"}
                    </button>
                    <button type="button" onClick={() => navigate('/spaces')}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
