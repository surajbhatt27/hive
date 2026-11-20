import { Link } from "react-router-dom";
import type { Space } from "../services/space";

interface SpaceCardProps {
    space: Space;
    onDelete?: (id: number) => void;
}

export const SpaceCard = ({ space, onDelete }: SpaceCardProps) => {
    const handleDelete = () => {
        if (window.confirm(`Delete "${space.name}"? This cannot be undone.`)) {
            onDelete?.(space.id);
        }
    };

    return (
        <div className="card relative flex flex-col gap-4 p-5 transition-colors hover:border-faint">
            <div>
                {/* The link stretches over the whole card, so the tile is clickable
                    and still behaves like a link (keyboard, middle click, new tab). */}
                <h3 className="mb-0.5">
                    <Link
                        to={`/spaces/${space.id}`}
                        className="text-ink no-underline after:absolute after:inset-0 after:content-['']"
                    >
                        {space.name}
                    </Link>
                </h3>
                {space.description ? (
                    <p className="text-sm">{space.description}</p>
                ) : (
                    <p className="text-sm text-faint italic">No description</p>
                )}
            </div>

            <div className="mt-auto flex items-center gap-2">
                <span className="tag">{space.role || "member"}</span>
                <span className="text-xs text-faint">
                    since {new Date(space.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </span>
                {space.role === "admin" && onDelete && (
                    <button
                        className="btn-quiet relative z-10 ml-auto px-2 py-1 text-xs"
                        onClick={handleDelete}
                        title="Delete space"
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
};
