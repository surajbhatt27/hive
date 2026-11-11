import { type Habit } from "../services/habit";

interface HabitCardProps {
    habit: Habit;
    currentUserId: number;
    isAdmin: boolean;
    onEdit: (habit: Habit) => void;
    onDelete: (id: number) => void;
}

export const HabitCard = ({ 
    habit, 
    currentUserId, 
    isAdmin, 
    onEdit, 
    onDelete 
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
                </div>
            </div>
            <div>
                {canEdit && (
                    <>
                        <button onClick={() => onEdit(habit)}>Edit</button>
                        <button onClick={() => onDelete(habit.id)}>Delete</button>
                    </>
                )}
            </div>
            <hr />
        </div>
    );
};