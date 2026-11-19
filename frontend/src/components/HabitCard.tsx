import { type Habit } from "../services/habit";

interface HabitCardProps {
    habit: Habit;
    currentUserId: number;
    isAdmin: boolean;
    onEdit: (habit: Habit) => void;
    onDelete: (id: number) => void;
    onToggle?: (habit: Habit) => void;
}

export const HabitCard = ({ 
    habit, 
    currentUserId, 
    isAdmin, 
    onEdit, 
    onDelete,
    onToggle,
}: HabitCardProps) => {
    const canEdit = 
        habit.type === 'space' 
            ? isAdmin 
            : habit.createdBy === currentUserId;

    const canDelete = canEdit;

    return (
        <div>
            <div>
                <h3>
                    {habit.name}
                    {habit.type === 'space' && <span> [Space]</span>}
                    {habit.type === 'personal' && <span> [Personal]</span>}
                </h3>
                {habit.description && <p>{habit.description}</p>}
                <div>
                    <span>Frequency: {habit.frequency}</span>
                    <span> | Created: {new Date(habit.createdAt).toLocaleDateString()}</span>
                    {typeof habit.streak === 'number' && habit.streak > 0 && (
                        <span> | Streak: {habit.streak} day{habit.streak === 1 ? '' : 's'}</span>
                    )}
                </div>
            </div>
            <div>
                {onToggle && (
                    <button onClick={() => onToggle(habit)}>
                        {habit.completedToday ? '✓ Done today (undo)' : 'Mark done today'}
                    </button>
                )}
                {canEdit && (
                    <>
                        <button onClick={() => onEdit(habit)}>Edit</button>
                        {canDelete && (
                            <button onClick={() => onDelete(habit.id)}>Delete</button>
                        )}
                    </>
                )}
            </div>
            <hr />
        </div>
    );
};