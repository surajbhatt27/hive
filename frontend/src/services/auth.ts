import axios from "axios";

const API = axios.create({
    baseURL: 'http://localhost:3000/api/auth',
    withCredentials: true,
})

export const authService = {
    register: (data: {name: string, email: string, password: string}) =>
        API.post('/register', data),

    login: (data: {email: string, password: string}) =>
        API.post('/login', data),

    refresh: () => API.post('/refresh'),

    logout: () => API.post('logout'),

    getMe: () => API.get('/me'),
}