import axios from "axios";
import { attachAuthInterceptors } from "./apiClient";

const API = axios.create({
    baseURL: 'http://localhost:3000/api/space',
    withCredentials: true
});

attachAuthInterceptors(API);

export type SpaceRole = 'admin' | 'member';

export interface SpaceMember {
    userId: number;
    name: string;
    email: string;
    role: SpaceRole;
    joinedAt: string;
    invitedBy: number | null;
}

export const memberService = {
    getAll: (spaceId: number) =>
        API.get<{ success: boolean; data: SpaceMember[] }>(`/${spaceId}/members`),

    updateRole: (spaceId: number, userId: number, role: SpaceRole) =>
        API.put<{ success: boolean; data: { userId: number; role: SpaceRole }; message: string }>(
            `/${spaceId}/members/${userId}`,
            { role }
        ),

    remove: (spaceId: number, userId: number) =>
        API.delete<{ success: boolean; message: string }>(`/${spaceId}/members/${userId}`),
};
