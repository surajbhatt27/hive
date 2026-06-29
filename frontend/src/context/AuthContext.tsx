import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "../services/auth";

interface User {
    id: number;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    register: (name: string, email: string, password: string) => Promise<void>
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
}


const AuthContext = createContext<AuthContextType | undefined >(undefined);

export const AuthProvider = ({children}: {children: ReactNode}) => {
    const [user, setUser] = useState<User|null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, [])

    const checkAuth = async () => {
        try {
            const res = await authService.getMe();
            setUser(res.data)
        } catch (error) {
            try {
                await authService.refresh();
                const res = await authService.getMe();
                setUser(res.data);
            } catch (error) {
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        const res = await authService.register({name, email, password});
        setUser(res.data.user)
    }

    const login = async (email: string, password: string) => {
        const res = await authService.login({email, password});
        setUser(res.data.user)
    }

    const logout = async () => {
        await authService.logout();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{user, loading, register, login, logout}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if(!context) {
        throw new Error("useAuth must be used within AuthProvider")
    }
    return context;
}