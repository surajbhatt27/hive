import axios from "axios";

const API = axios.create({
    baseURL: 'http://localhost:3000/api',
    withCredentials: true
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Habit {
    id: number;
    spaceId: number;
    createdBy: number;
    name: string;
    description: string | null;
    type: 'space' | 'personal';
    frequency: Frequency;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateHabitData {
    name: string;
    description?: string;
    type?: 'space' | 'personal';
    frequency?: Frequency;
}

export interface UpdateHabitData {
    name?: string;
    description?: string;
    frequency?: Frequency;
}

export const habitService = {
    getAll: (spaceId: number, type?: 'space' | 'personal') => 
        API.get<{success: boolean; data: Habit[]}>(
            `/spaces/${spaceId}/habits${type ? `?type=${type}` : ''}`
        ),

    getById: (spaceId: number, habitId: number) => 
        API.get<{success: boolean; data: Habit}>(`/spaces/${spaceId}/habits/${habitId}`),

    create: (spaceId: number, data: CreateHabitData) => 
        API.post<{success: boolean; data: Habit; message: string}>(
            `/spaces/${spaceId}/habits`, 
            data
        ),

    update: (spaceId: number, habitId: number, data: UpdateHabitData) => 
        API.put<{success: boolean; data: Habit; message: string}>(
            `/spaces/${spaceId}/habits/${habitId}`, 
            data
        ),

    delete: (spaceId: number, habitId: number) => 
        API.delete<{success: boolean; message: string}>(
            `/spaces/${spaceId}/habits/${habitId}`
        ),
};