import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { spaceService, type SpacePreview } from "../services/space";
import { useAuth } from "../context/AuthContext";
import { useSpaces } from "../context/SpaceContext";

export default function JoinSpace() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { fetchSpaces } = useSpaces();
    const [space, setSpace] = useState<SpacePreview | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (slug) {
            load(slug);
        }
    }, [slug]);

    const load = async (inviteSlug: string) => {
        try {
            setLoading(true);
            setError("");
            const response = await spaceService.previewBySlug(inviteSlug);
            setSpace(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load this invite");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!slug) return;
        setJoining(true);
        setError("");
        try {
            const response = await spaceService.joinSpace(slug);
            await fetchSpaces();
            navigate(`/spaces/${response.data.data.id}`);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to join space");
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return <div className="p-6">Loading invite...</div>;
    }

    if (!space) {
        return (
            <div className="p-6 space-y-4">
                <h1 className="text-2xl font-semibold">Invite not found</h1>
                <p>{error || "This invite link is invalid or the space no longer exists."}</p>
                <button onClick={() => navigate('/spaces')}>Back to spaces</button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-4 max-w-lg">
            <h1 className="text-2xl font-semibold">Join {space.name}</h1>
            {space.description && <p>{space.description}</p>}
            <p className="text-sm">
                {space.memberCount} member{space.memberCount === 1 ? '' : 's'}
            </p>

            {error && <div className="text-red-500">{error}</div>}

            {space.isMember ? (
                <div className="space-y-3">
                    <p>You are already a member of this space.</p>
                    <button onClick={() => navigate(`/spaces/${space.id}`)}>
                        Open space
                    </button>
                </div>
            ) : user ? (
                <div className="space-y-3">
                    <button onClick={handleJoin} disabled={joining}>
                        {joining ? 'Joining...' : 'Join space'}
                    </button>
                    <button onClick={() => navigate('/spaces')} disabled={joining}>
                        Cancel
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <p>Sign in or create an account to join this space.</p>
                    <div className="flex items-center gap-3">
                        <Link to={`/login?redirect=${encodeURIComponent(`/join/${slug ?? ''}`)}`}>
                            Sign in
                        </Link>
                        <Link to={`/register?redirect=${encodeURIComponent(`/join/${slug ?? ''}`)}`}>
                            Create account
                        </Link>
                    </div>
                    <button onClick={() => navigate('/login')}>Cancel</button>
                </div>
            )}
        </div>
    );
}
