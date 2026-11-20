import { useState, useEffect } from "react";
import { type Habit, type UpdateHabitData } from "../services/habit";
import { draftFromHabit, emptyScheduleDraft, scheduleError, schedulePayload, type ScheduleDraft } from "../utils/schedule";
import { ScheduleFields } from "./ScheduleFields";

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
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [schedule, setSchedule] = useState<ScheduleDraft>(emptyScheduleDraft);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (habit) {
            setName(habit.name);
            setDescription(habit.description || '');
            setSchedule(draftFromHabit(habit));
        }
    }, [habit]);

    if (!isOpen || !habit) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Habit name is required');
            return;
        }

        const scheduleMessage = scheduleError(schedule);
        if (scheduleMessage) {
            setError(scheduleMessage);
            return;
        }

        setLoading(true);
        setError('');
        try {
            await onSubmit({
                name: name.trim(),
                description: description.trim() || undefined,
                ...schedulePayload(schedule),
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update habit');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div>
                <h2>Edit Habit</h2>
                
                {error && <div>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Habit Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label>Description (optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            disabled={loading}
                        />
                    </div>

                    <ScheduleFields value={schedule} onChange={setSchedule} disabled={loading} />

                    <div>
                        <button type="button" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Habit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};