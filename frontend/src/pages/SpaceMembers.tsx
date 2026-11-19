import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSpaces } from "../context/SpaceContext";
import { memberService, type SpaceMember, type SpaceRole } from "../services/member";
import type { Space } from "../services/space";

export default function SpaceMembers() {
    const { id } = useParams<{ id: string }>();
    const spaceId = Number(id);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getSpace } = useSpaces();

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
                navigate('/spaces');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to remove member");
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
        return <div className="p-6">Loading members...</div>;
    }

    if (!space) {
        return (
            <div className="p-6 space-y-3">
                <p>{error || "Space not found"}</p>
                <button onClick={() => navigate('/spaces')}>Back to spaces</button>
            </div>
        );
    }

    const isAdmin = space.role === 'admin';
    const inviteLink = `${window.location.origin}/join/${space.slug}`;

    return (
        <div className="p-6 space-y-4">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold">{space.name} members</h1>
                <p className="text-sm">Admins manage settings and space habits. Members track habits.</p>
            </div>

            {error && <div className="text-red-500">{error}</div>}

            <div className="space-y-2">
                <h2 className="text-lg">Invite people</h2>
                <p className="text-sm">Share this link so others can join this space.</p>
                <div className="flex items-center gap-2">
                    <code className="text-sm break-all">{inviteLink}</code>
                    <button onClick={copyInvite}>{copied ? 'Copied' : 'Copy link'}</button>
                </div>
            </div>

            <hr />

            <div className="space-y-2">
                <h2 className="text-lg">Members ({members.length})</h2>
                {members.map(member => (
                    <div key={member.userId} className="flex items-center justify-between gap-2">
                        <div>
                            <div>
                                {member.name}
                                {member.userId === user?.id && <span className="text-sm"> (you)</span>}
                            </div>
                            <div className="text-sm">{member.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isAdmin ? (
                                <select
                                    value={member.role}
                                    disabled={busyUserId === member.userId}
                                    onChange={(e) => handleRoleChange(member, e.target.value as SpaceRole)}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="member">Member</option>
                                </select>
                            ) : (
                                <span className="text-sm">{member.role}</span>
                            )}
                            {isAdmin && (
                                <button
                                    onClick={() => handleRemove(member)}
                                    disabled={busyUserId === member.userId}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={() => navigate(`/spaces/${space.id}`)}>Back to space</button>
        </div>
    );
}
