import { useNavigate } from "react-router-dom";
import { useSpaces } from "../context/SpaceContext";
import { SpaceCard } from "../components/spaceCard";


export default function Spaces() {
    const { spaces, loading, error, deleteSpace } = useSpaces();
    const navigate = useNavigate();
    return (
        <div className="space-y-8">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-1">
                    <p className="eyebrow">Spaces</p>
                    <h1>Where your habits live</h1>
                    <p className="text-sm">Each space has its own habits, members and invite link.</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/spaces/create')}>
                    + New space
                </button>
            </header>

            {error && <p className="alert">{error}</p>}

            {loading ? (
                <p className="eyebrow animate-pulse">Loading spaces…</p>
            ) : spaces.length === 0 ? (
                <div className="empty">
                    <h2 className="mb-1">No spaces yet</h2>
                    <p className="mx-auto mb-5 max-w-sm text-sm">
                        Create your first space to start tracking habits — on your own, or with people
                        who share the same goals.
                    </p>
                    <button className="btn-primary" onClick={() => navigate('/spaces/create')}>
                        Create a space
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {spaces.map((space: any) => (
                        <SpaceCard
                            key={space.id}
                            space={space}
                            onDelete={deleteSpace}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
