import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { spaceService, type CreateSpaceData, type Space } from "../services/space";

interface SpaceContextType {
    spaces: Space[];
    loading: boolean;
    error: string | null;
    createSpace: (data: CreateSpaceData) => Promise<Space>;
    fetchSpaces: () => Promise<void>;
    getSpace: (id: number) => Promise<Space>;
    updateSpace: (id: number, data: Partial<CreateSpaceData>) => Promise<Space>;
    deleteSpace: (id: number) => Promise<void>;
    currentSpace: Space | null;
    setCurrentSpace: (space: Space | null) => void;
}

export const SpaceContext = createContext<SpaceContextType| undefined>(undefined);

export const SpaceProvider = ({children}: {children: ReactNode}) => {
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
    const [error, setError] = useState<string | null>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSpaces();
    }, []);

    const fetchSpaces = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await spaceService.getAll();
            setSpaces(response.data.data);
        } catch (error: any) {
            setError(error.response?.data?.message || "Failed to fetch spaces");
            console.error("error in fetching spaces", error);
        }
    }

    const createSpace = async (data: CreateSpaceData): Promise<Space> => {
        try {
            setError(null);
            const response = await spaceService.creatSpace(data);
            const newSpace = response.data.data;

            setSpaces(prev => [...prev, newSpace]);
            return newSpace;
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to create space";
            setError(message);
            throw new Error(message);
        }
    }

    const getSpace = async (id: number): Promise<Space> => {
        try {
            setError(null);
            const response = await spaceService.getSpaceById(id)
            return response.data.data;
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to fetch space";
            setError(message);
            throw new Error(message);
        }
    }

    const updateSpace = async (id: number, data: Partial<CreateSpaceData>): Promise<Space> => {
        try {
            setError(null);
            const response = await spaceService.updateSpace(id, data)
            const updateSpace = response.data.data;
            setSpaces(prev =>
                prev.map(space => 
                    space.id === id ? updateSpace : space
                )
            );

            if(currentSpace?.id !== id) {
                setCurrentSpace(updateSpace);
            }
            return updateSpace;
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to update space";
            setError(message);
            throw new Error(message);
        }
    }

    const deleteSpace = async (id: number): Promise<void> => {
        try {
            setError(null);
            await spaceService.deleteSpace(id);
            setSpaces(prev => prev.filter(spaces => spaces.id !== id));
            if (currentSpace?.id === id) {
                setCurrentSpace(null);
            }
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to update space";
            setError(message);
            throw new Error(message);
        }
    }

    return (
        <SpaceContext.Provider value={
            {spaces,
            loading,
            error,
            createSpace,
            fetchSpaces,
            getSpace,
            updateSpace,
            deleteSpace,
            currentSpace,
            setCurrentSpace,}
        }>
            {children}
        </SpaceContext.Provider>)
}

export const useSpaces = () => {
    const context = useContext(SpaceContext);
    if (!context) {
        throw new Error("useSpaces must be used within SpaceProvider");
    }
    return context;
}