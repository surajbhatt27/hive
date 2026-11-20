import { useState } from "react";
import type { CreateHabitData } from "../services/habit";
import { emptyScheduleDraft, scheduleError, schedulePayload, type ScheduleDraft } from "../utils/schedule";
import { ScheduleFields } from "./ScheduleFields";
import { Modal } from "./Modal";

interface CreateHabitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateHabitData) => Promise<void>;
    isAdmin: boolean;
}

export const CreateHabitModal = ({
    isOpen,
    onClose,
    onSubmit,
    isAdmin
}: CreateHabitModalProps) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"space" | "personal">("personal");
    const [schedule, setSchedule] = useState<ScheduleDraft>(emptyScheduleDraft);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Habit name is required");
            return;
        }

        const scheduleMessage = scheduleError(schedule);
        if (scheduleMessage) {
            setError(scheduleMessage);
            return;
        }

        setLoading(true);
        setError("");
        try {
            await onSubmit({
                name: name.trim(),
                description: description.trim() || undefined,
                type,
                ...schedulePayload(schedule),
            });
            setName("");
            setDescription("");
            setType("personal");
            setSchedule(emptyScheduleDraft());
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to create habit");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal label="Create a new habit" onClose={onClose}>
            <h2 className="mb-1">New habit</h2>
            <p className="mb-5 text-sm">
                Something small enough to do on the days it's due.
            </p>

            {error && <p className="alert mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="habit-name">Habit name <span className="text-clay">*</span></label>
                    <input
                        id="habit-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Read 20 pages"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="habit-description">Description (optional)</label>
                    <textarea
                        id="habit-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What does doing this look like?"
                        rows={2}
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="habit-type">Who is it for</label>
                    <select
                        id="habit-type"
                        value={type}
                        onChange={(e) => setType(e.target.value as "space" | "personal")}
                        disabled={loading || !isAdmin}
                    >
                        <option value="personal">Just me</option>
                        {isAdmin && (
                            <option value="space">Everyone in this space</option>
                        )}
                    </select>
                </div>

                <ScheduleFields value={schedule} onChange={setSchedule} disabled={loading} />

                <div className="flex items-center gap-2 pt-1">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? "Creating…" : "Create habit"}
                    </button>
                    <button type="button" className="btn-quiet" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
};
