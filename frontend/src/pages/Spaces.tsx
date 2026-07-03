import { useNavigate } from "react-router-dom";
import { useSpaces } from "../context/SpaceContext";
import { SpaceCard } from "../components/spaceCard";


export default function Spaces() {
    const { spaces, loading, error, deleteSpace } = useSpaces();
    const navigate = useNavigate();
    return (
        <div>
            <div>
                <div>
                    <h1>Your spaces</h1>
                    <p>Manage your habit spaces</p>
                </div>
                <button onClick={() => navigate('/spaces/create')}>
                    + New Space
                </button>
            </div>
            {error && (
                <div>{error}</div>
            )}

            {spaces.length === 0 ? (
                <div>
                    <h3>No spaces yet</h3>
                    <p>Create your first space to start tracking habits</p>
                    <button onClick={() => navigate('/spaces/create')}>
                        Create Space
                    </button>
                </div>
            ):(
                <div>
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
