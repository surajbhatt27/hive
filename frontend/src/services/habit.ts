import axios from "axios";
import { attachAuthInterceptors } from "./apiClient";

const API = axios.create({
    baseURL: 'http://localhost:3000/api',
    withCredentials: true
});

attachAuthInterceptors(API)

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export type HabitSchedule =
    | { kind: 'daily' }
    | { kind: 'weekly'; weekdays: number[] }
    | { kind: 'monthly'; monthDays: number[] }
    | { kind: 'custom'; intervalDays: number };

export interface SchedulePayload {
    frequency?: Frequency;
    weekdays?: number[];
    monthDays?: number[];
    intervalDays?: number;
}

export interface Habit {
    id: number;
    spaceId: number;
    createdBy: number;
    name: string;
    description: string | null;
    type: 'space' | 'personal';
    frequency: Frequency;
    schedule: HabitSchedule;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    completedToday?: boolean;
    dueToday?: boolean;
    streak?: number;
    lastCompletedAt?: string | null;
}

export interface CompletionResult {
    completedToday: boolean;
    dueToday?: boolean;
    streak: number;
    lastCompletedAt: string | null;
}

export interface HabitLog {
    id: number;
    userId: number;
    userName: string;
    logDate: string;
    completedAt: string;
    note: string | null;
}

export interface HabitHistory {
    logs: HabitLog[];
    completedToday: boolean;
    dueToday?: boolean;
    streak: number;
    lastCompletedAt: string | null;
}

export interface CreateHabitData extends SchedulePayload {
    name: string;
    description?: string;
    type?: 'space' | 'personal';
}

export interface UpdateHabitData extends SchedulePayload {
    name?: string;
    description?: string;
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

    getHistory: (spaceId: number, habitId: number) =>
        API.get<{ success: boolean; data: HabitHistory }>(
            `/spaces/${spaceId}/habits/${habitId}/logs`
        ),

    complete: (spaceId: number, habitId: number, note?: string) =>
        API.post<{success: boolean; data: CompletionResult; message: string}>(
            `/spaces/${spaceId}/habits/${habitId}/logs`,
            note ? { note } : {}
        ),

    undoCompletion: (spaceId: number, habitId: number) =>
        API.delete<{success: boolean; data: CompletionResult; message: string}>(
            `/spaces/${spaceId}/habits/${habitId}/logs/today`
        ),
};