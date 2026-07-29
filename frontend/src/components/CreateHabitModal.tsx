import { useState } from "react";

type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';

interface CreateHabitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; description?: string; type: 'space' | 'personal'; frequency: Frequency }) => Promise<void>;
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
    const [frequency, setFrequency] = useState<Frequency>('daily');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

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
                type,
                frequency
            });
            setName('');
            setDescription('');
            setType('personal');
            setFrequency('daily');
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
                            {loading ? 'Creating...' : 'Create Habit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};