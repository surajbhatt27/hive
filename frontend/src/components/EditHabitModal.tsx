import { useState, useEffect } from "react";
import { type Habit, type UpdateHabitData } from "../services/habit";
import { draftFromHabit, emptyScheduleDraft, scheduleError, schedulePayload, type ScheduleDraft } from "../utils/schedule";
import { ScheduleFields } from "./ScheduleFields";
import { Modal } from "./Modal";

interface EditHabitModalProps {
    isOpen: boolean;
    habit: Habit | null;
    onClose: () => void;
    onSubmit: (data: UpdateHabitData) => Promise<void>;
}

export const EditHabitModal = ({
    isOpen,
    habit,
    onClose,
    onSubmit
}: EditHabitModalProps) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [schedule, setSchedule] = useState<ScheduleDraft>(emptyScheduleDraft);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (habit) {
            setName(habit.name);
            setDescription(habit.description || "");
            setSchedule(draftFromHabit(habit));
        }
    }, [habit]);

    if (!isOpen || !habit) return null;

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
                ...schedulePayload(schedule),
            });
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to update habit");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal label="Edit habit" onClose={onClose}>
            <h2 className="mb-1">Edit habit</h2>
            <p className="mb-5 text-sm">
                Changing the schedule only changes which days count from now on.
            </p>

            {error && <p className="alert mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="edit-habit-name">Habit name <span className="text-clay">*</span></label>
                    <input
                        id="edit-habit-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="edit-habit-description">Description (optional)</label>
                    <textarea
                        id="edit-habit-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        disabled={loading}
                    />
                </div>

                <ScheduleFields value={schedule} onChange={setSchedule} disabled={loading} />

                <div className="flex items-center gap-2 pt-1">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? "Saving…" : "Save changes"}
                    </button>
                    <button type="button" className="btn-quiet" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
};
