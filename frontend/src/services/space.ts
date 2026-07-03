import axios from "axios";

const API = axios.create({
    baseURL: 'http://localhost:3000/api/auth',
    withCredentials: true
})

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if(token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config;
})

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

export const spaceService = {
    creatSpace: (data: CreateSpaceData) => 
        API.post<{success: boolean; data: Space; message: string}>('/', data),

    getAll: () => API.get<{success: boolean; data: Space[]}>('/'),

    getSpaceById: (id: number) => 
        API.get<{success: boolean; data: Space}>(`/${id}`),

    updateSpace: (id: number, data: UpdateSpaceData) => 
        API.put<{success: boolean; data: Space; message: string}>(`/${id}`, data),

    deleteSpace: (id: number) => API.delete<{success: boolean; message: string}>(`/${id}`),
}