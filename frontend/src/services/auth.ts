import axios from "axios";

const API = axios.create({
    baseURL: 'http://localhost:3000/api/auth',
    withCredentials: true,
})

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    register: (data: {name: string, email: string, password: string}) =>
        API.post('/register', data),

    login: (data: {email: string, password: string}) =>
        API.post('/login', data),

    refresh: () => API.post('/refresh'),

    logout: () => API.post('/logout'),

    getMe: () => API.get('/me'),

    checkAuth: () => API.get('/check'),
}