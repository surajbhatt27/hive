import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { spaceService, type SpacePreview } from "../services/space";
import { useAuth } from "../context/AuthContext";
import { useSpaces } from "../context/SpaceContext";
import { Wordmark } from "../components/Wordmark";

export default function JoinSpace() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { fetchSpaces } = useSpaces();
    const [space, setSpace] = useState<SpacePreview | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState("");

    // The preview is personalized ("are you already a member?"), so it must wait
    // for auth to resolve and load again when someone signs in or out. The
    // previous preview stays on screen while that refetch runs.
    useEffect(() => {
        if (!slug || authLoading) return;
        let cancelled = false;

        const load = async () => {
            try {
                setError("");
                const response = await spaceService.previewBySlug(slug);
                if (!cancelled) setSpace(response.data.data);
            } catch (err: any) {
                if (!cancelled) setError(err.response?.data?.message || "Failed to load this invite");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [slug, authLoading, user?.id]);

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
        return (
            <div className="grid min-h-screen place-items-center">
                <p className="eyebrow animate-pulse">Loading invite…</p>
            </div>
        );
    }

    if (!space) {
        return (
            <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5">
                <div className="card space-y-3 p-6">
                    <Wordmark />
                    <h1>Invite not found</h1>
                    <p className="text-sm">{error || "This invite link is invalid or the space no longer exists."}</p>
                    <button onClick={() => navigate('/spaces')}>Go to my spaces</button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-14">
            <Wordmark className="mb-8" />

            <div className="card p-6">
                <p className="eyebrow mb-1">You're invited</p>
                <h1 className="mb-2">{space.name}</h1>
                {space.description && <p className="mb-3">{space.description}</p>}
                <p className="mb-6 text-sm">
                    {space.memberCount} member{space.memberCount === 1 ? '' : 's'} · habits tracked together
                </p>

                {error && (
                    <p className="alert mb-4">{error}</p>
                )}

                {space.isMember ? (
                    <div className="space-y-3">
                        <p className="text-sm">You're already in this space.</p>
                        <button className="btn-primary w-full" onClick={() => navigate(`/spaces/${space.id}`)}>
                            Open space
                        </button>
                    </div>
                ) : user ? (
                    <div className="space-y-2">
                        <button className="btn-primary w-full" onClick={handleJoin} disabled={joining}>
                            {joining ? 'Joining…' : 'Join space'}
                        </button>
                        <button className="btn-quiet w-full" onClick={() => navigate('/spaces')} disabled={joining}>
                            Not now
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm">Sign in or create an account to take part.</p>
                        <Link
                            to={`/login?redirect=${encodeURIComponent(`/join/${slug ?? ''}`)}`}
                            className="btn btn-primary w-full"
                        >
                            Sign in
                        </Link>
                        <Link
                            to={`/register?redirect=${encodeURIComponent(`/join/${slug ?? ''}`)}`}
                            className="btn w-full"
                        >
                            Create an account
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
