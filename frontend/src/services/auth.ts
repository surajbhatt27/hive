import axios from "axios";
import { attachAuthInterceptors } from "./apiClient";

const API = axios.create({
    baseURL: 'http://localhost:3000/api/auth',
    withCredentials: true,
})

attachAuthInterceptors(API)

export const authService = {
    register: (data: {name: string, email: string, password: string, timezone?: string}) =>
        API.post('/register', data),

    login: (data: {email: string, password: string}) =>
        API.post('/login', data),

    refresh: () => API.post('/refresh'),

    logout: () => API.post('/logout'),

    getMe: () => API.get('/me'),

    updateTimeZone: (timezone: string) => API.patch('/timezone', { timezone }),

    checkAuth: () => API.get('/check'),
}