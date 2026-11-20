import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Wordmark } from "./Wordmark";

const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link${isActive ? " nav-link-active" : ""}`;

export const AppLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen">
            <header className="border-b border-line">
                <div className="mx-auto flex w-full max-w-[58rem] items-center gap-6 px-5 py-3 sm:px-8">
                    <Wordmark />

                    <nav className="flex items-center gap-1">
                        <NavLink to="/dashboard" className={linkClass}>Today</NavLink>
                        <NavLink to="/spaces" className={linkClass}>Spaces</NavLink>
                    </nav>

                    <div className="ml-auto flex items-center gap-3">
                        <span className="hidden text-sm text-muted sm:inline">{user?.name}</span>
                        <button className="btn-quiet" onClick={handleSignOut}>
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <main className="page">
                <Outlet />
            </main>
        </div>
    );
};
