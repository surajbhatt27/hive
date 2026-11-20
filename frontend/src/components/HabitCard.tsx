import { Link } from "react-router-dom";
import { type Habit } from "../services/habit";
import { describeSchedule } from "../utils/schedule";

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
    const due = habit.dueToday !== false;

    return (
        <li className="flex flex-wrap items-center gap-2 py-3">
            {onToggle && (
                <button
                    className={`check${habit.completedToday ? " check-done" : ""}`}
                    onClick={() => onToggle(habit)}
                    disabled={!due}
                    title={due ? undefined : "Not scheduled today"}
                    aria-label={habit.completedToday ? `Mark ${habit.name} as not done` : `Mark ${habit.name} as done`}
                >
                    {habit.completedToday ? "✓" : ""}
                </button>
            )}

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-medium ${due ? "text-ink" : "text-faint"}`}>{habit.name}</span>
                    <span className="tag">{habit.type === 'space' ? 'Space' : 'Personal'}</span>
                    {typeof habit.streak === 'number' && habit.streak > 0 && (
                        <span className="tag tag-moss">
                            {habit.streak} day{habit.streak === 1 ? '' : 's'} streak
                        </span>
                    )}
                </div>
                <div className="mt-0.5 truncate text-xs text-faint">
                    {describeSchedule(habit.schedule, habit.frequency)}
                    {habit.description && <> · {habit.description}</>}
                    {!due && <> · not today</>}
                </div>
            </div>

            {/* On a phone the actions drop to their own line so the habit name
                keeps a readable width. From sm up they sit inline at the right. */}
            <div className="flex w-full items-center justify-end gap-1 sm:w-auto sm:justify-start">
                <Link to={`/spaces/${habit.spaceId}/habits/${habit.id}`} className="mr-1 text-sm">
                    History
                </Link>
                {canEdit && (
                    <>
                        <button className="btn-quiet px-2 py-1 text-xs" onClick={() => onEdit(habit)}>
                            Edit
                        </button>
                        {canDelete && (
                            <button
                                className="btn-quiet px-2 py-1 text-xs text-clay"
                                onClick={() => onDelete(habit.id)}
                            >
                                Delete
                            </button>
                        )}
                    </>
                )}
            </div>
        </li>
    );
};
