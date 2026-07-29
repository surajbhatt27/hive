import { useState, useEffect } from "react";
import { type Habit } from "../services/habit";

type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';

interface EditHabitModalProps {
    isOpen: boolean;
    habit: Habit | null;
    onClose: () => void;
    onSubmit: (data: { name: string; description?: string; frequency: Frequency }) => Promise<void>;
}

export const EditHabitModal = ({ 
    isOpen, 
    habit, 
    onClose, 
    onSubmit 
}: EditHabitModalProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [frequency, setFrequency] = useState<Frequency>('daily');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (habit) {
            setName(habit.name);
            setDescription(habit.description || '');
            setFrequency(habit.frequency as Frequency);
        }
    }, [habit]);

    if (!isOpen || !habit) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Habit name is required');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await onSubmit({
                name: name.trim(),
                description: description.trim() || undefined,
                frequency
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

                    <div>
                        <label>Frequency</label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value as Frequency)}
                            disabled={loading}
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>

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