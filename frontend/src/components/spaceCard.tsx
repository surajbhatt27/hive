import { useNavigate } from "react-router-dom";
import type { Space } from "../services/space";

interface SpaceCardProps {
    space: Space;
    onDelete?: (id: number) => void;
}

export const SpaceCard = ({ space, onDelete }: SpaceCardProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/spaces/${space.id}`);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Delete "${space.name}"? This cannot be undone.`)) {
            onDelete?.(space.id);
        }
    };

    return (
        <div onClick={handleClick}>
            <div>
                <h3>{space.name}</h3>
                {space.description && <p>{space.description}</p>}
                <div>
                    <span>{space.role || 'member'}</span>
                    <span>Created: {new Date(space.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            {space.role === 'admin' && onDelete && (
                <button onClick={handleDelete}>
                    Delete
                </button>
            )}
        </div>
    );
};