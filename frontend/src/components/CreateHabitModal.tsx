import { useState } from "react";
import type { CreateHabitData } from "../services/habit";
import { emptyScheduleDraft, scheduleError, schedulePayload, type ScheduleDraft } from "../utils/schedule";
import { ScheduleFields } from "./ScheduleFields";

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
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'space' | 'personal'>('personal');
    const [schedule, setSchedule] = useState<ScheduleDraft>(emptyScheduleDraft);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

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
                type,
                ...schedulePayload(schedule),
            });
            setName('');
            setDescription('');
            setType('personal');
            setSchedule(emptyScheduleDraft());
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create habit');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div>
                <h2>Create New Habit</h2>
                
                {error && <div>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Habit Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Read 20 pages"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label>Description (optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this habit about?"
                            rows={3}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label>Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as 'space' | 'personal')}
                            disabled={loading || !isAdmin}
                        >
                            <option value="personal">Personal (only you)</option>
                            {isAdmin && (
                                <option value="space">Space (all members)</option>
                            )}
                        </select>
                        {!isAdmin && type === 'space' && (
                            <p>Only admins can create space habits</p>
                        )}
                    </div>

                    <ScheduleFields value={schedule} onChange={setSchedule} disabled={loading} />

                    <div>
                        <button type="button" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Habit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};