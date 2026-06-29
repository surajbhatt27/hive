import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({children}: {children: ReactNode}) => {
const {user, loading} = useAuth();

    if(loading) return <>Loading...</>
    if(!user) return <Navigate to={'login'}/>
    return <>{children}</>
}