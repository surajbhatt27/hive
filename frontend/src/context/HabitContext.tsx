import { createContext, useContext, useState, type ReactNode } from "react";
import { habitService, type Habit, type CreateHabitData, type UpdateHabitData } from "../services/habit";

interface HabitContextType {
    habits: Habit[];
    loading: boolean;
    error: string | null;
    fetchHabits: (spaceId: number, type?: 'space' | 'personal') => Promise<void>;
    createHabit: (spaceId: number, data: CreateHabitData) => Promise<Habit>;
    updateHabit: (spaceId: number, habitId: number, data: UpdateHabitData) => Promise<Habit>;
    deleteHabit: (spaceId: number, habitId: number) => Promise<void>;
    clearError: () => void;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider = ({ children }: { children: ReactNode }) => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHabits = async (spaceId: number, type?: 'space' | 'personal') => {
        try {
            setLoading(true);
            setError(null);
            const response = await habitService.getAll(spaceId, type);
            setHabits(response.data.data);
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to fetch habits";
            setError(message);
            console.error("Error fetching habits:", error);
        } finally {
            setLoading(false);
        }
    };

    const createHabit = async (spaceId: number, data: CreateHabitData): Promise<Habit> => {
        try {
            setLoading(true);
            setError(null);
            const response = await habitService.create(spaceId, data);
            const newHabit = response.data.data;
            setHabits(prev => [...prev, newHabit]);
            return newHabit;
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to create habit";
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const updateHabit = async (spaceId: number, habitId: number, data: UpdateHabitData): Promise<Habit> => {
        try {
            setLoading(true);
            setError(null);
            const response = await habitService.update(spaceId, habitId, data);
            const updatedHabit = response.data.data;
            setHabits(prev => 
                prev.map(habit => habit.id === habitId ? updatedHabit : habit)
            );
            return updatedHabit;
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to update habit";
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const deleteHabit = async (spaceId: number, habitId: number): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            await habitService.delete(spaceId, habitId);
            setHabits(prev => prev.filter(habit => habit.id !== habitId));
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to delete habit";
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const clearError = () => setError(null);

    return (
        <HabitContext.Provider value={{
            habits,
            loading,
            error,
            fetchHabits,
            createHabit,
            updateHabit,
            deleteHabit,
            clearError,
        }}>
            {children}
        </HabitContext.Provider>
    );
};

export const useHabits = () => {
    const context = useContext(HabitContext);
    if (!context) {
        throw new Error("useHabits must be used within HabitProvider");
    }
    return context;
};