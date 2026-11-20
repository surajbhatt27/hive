import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSpaces } from "../context/SpaceContext";
import { memberService, type SpaceMember, type SpaceRole } from "../services/member";
import type { Space } from "../services/space";

export default function SpaceMembers() {
    const { id } = useParams<{ id: string }>();
    const spaceId = Number(id);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getSpace, fetchSpaces } = useSpaces();

    const [space, setSpace] = useState<Space | null>(null);
    const [members, setMembers] = useState<SpaceMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyUserId, setBusyUserId] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (spaceId) {
            load();
        }
    }, [spaceId]);

    const load = async () => {
        try {
            setLoading(true);
            setError("");
            const [spaceData, memberResponse] = await Promise.all([
                getSpace(spaceId),
                memberService.getAll(spaceId),
            ]);
            setSpace(spaceData);
            setMembers(memberResponse.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to load members");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (member: SpaceMember, role: SpaceRole) => {
        setBusyUserId(member.userId);
        setError("");
        try {
            await memberService.updateRole(spaceId, member.userId, role);
            setMembers(prev => prev.map(m => m.userId === member.userId ? { ...m, role } : m));
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update role");
        } finally {
            setBusyUserId(null);
        }
    };

    const handleRemove = async (member: SpaceMember) => {
        if (!window.confirm(`Remove ${member.name} from this space?`)) return;
        setBusyUserId(member.userId);
        setError("");
        try {
            await memberService.remove(spaceId, member.userId);
            setMembers(prev => prev.filter(m => m.userId !== member.userId));
            if (member.userId === user?.id) {
                await fetchSpaces();
                navigate('/spaces');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to remove member");
        } finally {
            setBusyUserId(null);
        }
    };

    const handleLeave = async () => {
        if (!space || !user) return;
        if (!window.confirm(`Leave "${space.name}"? You'll need an invite to rejoin.`)) return;
        setBusyUserId(user.id);
        setError("");
        try {
            await memberService.remove(spaceId, user.id);
            await fetchSpaces();
            navigate('/spaces');
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to leave space");
        } finally {
            setBusyUserId(null);
        }
    };

    const copyInvite = async () => {
        if (!space) return;
        const link = `${window.location.origin}/join/${space.slug}`;
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setError(`Could not copy automatically. Invite link: ${link}`);
        }
    };

    if (loading) {
        return <p className="eyebrow animate-pulse">Loading members…</p>;
    }

    if (!space) {
        return (
            <div className="space-y-3">
                <p>{error || "Space not found"}</p>
                <button onClick={() => navigate('/spaces')}>Back to spaces</button>
            </div>
        );
    }

    const isAdmin = space.role === 'admin';
    const inviteLink = `${window.location.origin}/join/${space.slug}`;

    return (
        <div className="space-y-8">
            <header className="space-y-3">
                <Link to={`/spaces/${space.id}`} className="inline-block text-sm">← Back to {space.name}</Link>
                <div className="space-y-1">
                    <p className="eyebrow">{members.length} member{members.length === 1 ? '' : 's'}</p>
                    <h1>People in this space</h1>
                    <p className="text-sm">
                        Admins manage settings and space habits. Members track habits.
                    </p>
                </div>
            </header>

            {error && <p className="alert">{error}</p>}

            <section className="card space-y-3 p-5">
                <div>
                    <h2 className="mb-0.5">Invite someone</h2>
                    <p className="text-sm">Anyone with this link can join this space.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-md border border-line bg-paper px-3 py-2 text-muted">
                        {inviteLink}
                    </code>
                    <button className="btn-primary" onClick={copyInvite}>
                        {copied ? 'Copied ✓' : 'Copy link'}
                    </button>
                </div>
            </section>

            <section className="space-y-3">
                <h2>Members</h2>
                <ul className="divide-y divide-line border-y border-line">
                    {members.map(member => (
                        <li
                            key={member.userId}
                            className="flex flex-wrap items-center justify-between gap-2 py-3"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{member.name}</span>
                                    {member.userId === user?.id && <span className="tag">you</span>}
                                </div>
                                <div className="truncate text-sm text-muted">{member.email}</div>
                            </div>

                            <div className="flex items-center gap-2">
                                {isAdmin ? (
                                    <>
                                        <select
                                            value={member.role}
                                            disabled={busyUserId === member.userId}
                                            onChange={(e) => handleRoleChange(member, e.target.value as SpaceRole)}
                                            className="w-auto py-1 text-xs"
                                            aria-label={`Role for ${member.name}`}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="member">Member</option>
                                        </select>
                                        <button
                                            className="btn-quiet px-2 py-1 text-xs text-clay"
                                            onClick={() => handleRemove(member)}
                                            disabled={busyUserId === member.userId}
                                        >
                                            Remove
                                        </button>
                                    </>
                                ) : (
                                    <span className="tag">{member.role}</span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <div className="flex items-center gap-2">
                {!isAdmin && (
                    <button className="btn-danger" onClick={handleLeave} disabled={busyUserId === user?.id}>
                        Leave space
                    </button>
                )}
                <button className="btn-quiet" onClick={() => navigate(`/spaces/${space.id}`)}>
                    Back to space
                </button>
            </div>
        </div>
    );
}
