import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="grid min-h-screen place-items-center">
                <p className="eyebrow animate-pulse">Opening hive…</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
