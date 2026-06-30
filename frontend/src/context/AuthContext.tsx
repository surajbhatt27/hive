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
    refreshUser: () => Promise<void>
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
            setUser(res.data.user)
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        const res = await authService.register({name, email, password});
        localStorage.setItem('accessToken', res.data.accessToken);
        setUser(res.data.user)
    }

    const login = async (email: string, password: string) => {
        const res = await authService.login({email, password});
        localStorage.setItem('accessToken', res.data.accessToken);
        setUser(res.data.user)
    }

    const logout = async () => {
        await authService.logout();
        localStorage.removeItem('accessToken');
        setUser(null);
    }

    const refreshUser = async () => {
        setLoading(true);
        await checkAuth();
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{user, loading, register, login, logout, refreshUser}}>
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