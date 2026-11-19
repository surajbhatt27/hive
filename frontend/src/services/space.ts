import axios from "axios";
import { attachAuthInterceptors } from "./apiClient";

const API = axios.create({
    baseURL: 'http://localhost:3000/api/space',
    withCredentials: true
})

attachAuthInterceptors(API)

export interface Space {
    id: number,
    name: string,
    description: string | null,
    slug: string,
    isActive: boolean,
    createdAt: string,
    updatedAt: string,
    role?: 'admin' | 'member';
}

export interface CreateSpaceData  {
    name: string,
    description?: string,
}

export interface UpdateSpaceData  {
    name?: string,
    description?: string,
}

export interface SpacePreview {
    id: number;
    name: string;
    description: string | null;
    slug: string;
    memberCount: number;
    isMember: boolean;
}

export interface SpaceSummary extends Space {
    memberCount: number;
    habitCount: number;
    completedToday: number;
    habits: {
        id: number;
        name: string;
        type: 'space' | 'personal';
        completed: boolean;
    }[];
}

export interface DashboardSummary {
    spaces: SpaceSummary[];
    totals: {
        spaces: number;
        habits: number;
        completedToday: number;
        members: number;
    };
}

export const spaceService = {
    creatSpace: (data: CreateSpaceData) => 
        API.post<{success: boolean; data: Space; message: string}>('/', data),

    getAll: () => API.get<{success: boolean; data: Space[]}>('/'),

    getSpaceById: (id: number) => 
        API.get<{success: boolean; data: Space}>(`/${id}`),

    updateSpace: (id: number, data: UpdateSpaceData) => 
        API.put<{success: boolean; data: Space; message: string}>(`/${id}`, data),

    deleteSpace: (id: number) => API.delete<{success: boolean; message: string}>(`/${id}`),

    getSummary: () => API.get<{success: boolean; data: DashboardSummary}>('/summary'),

    previewBySlug: (slug: string) =>
        API.get<{success: boolean; data: SpacePreview}>(`/preview/${encodeURIComponent(slug)}`),

    joinSpace: (slug: string) =>
        API.post<{success: boolean; data: Space; message: string}>('/join', { slug }),
}