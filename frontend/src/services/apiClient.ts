import axios, { AxiosError, type AxiosRequestConfig } from "axios";

const BASE_URL = 'http://localhost:3000/api';

// Plain axios (no auth interceptor)
const refreshClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
    // De-dupe concurrent refreshes: all callers await the same promise
    if (!refreshPromise) {
        refreshPromise = refreshClient
            .post<{ accessToken: string }>('/auth/refresh')
            .then(res => {
                const token = res.data.accessToken;
                localStorage.setItem('accessToken', token);
                return token;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

export function attachAuthInterceptors(instance: ReturnType<typeof axios.create>) {
    // Request: attach current access token
    instance.interceptors.request.use((config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Response: on 401, refresh once and retry
    instance.interceptors.response.use(
        (res) => res,
        async (error: AxiosError) => {
            const original = error.config as AxiosRequestConfig & { _retry?: boolean };
            const status = error.response?.status;
            const url = original?.url ?? '';

            const isAuthEndpoint =
                url.includes('/auth/refresh') ||
                url.includes('/auth/login') ||
                url.includes('/auth/register') ||
                url.includes('/auth/check') ||
                url.includes('/auth/logout');

            if (status === 401 && original && !original._retry && !isAuthEndpoint) {
                original._retry = true;
                try {
                    const newToken = await refreshAccessToken();
                    original.headers = {
                        ...(original.headers || {}),
                        Authorization: `Bearer ${newToken}`,
                    };
                    return instance(original);
                } catch (refreshErr) {
                    localStorage.removeItem('accessToken');
                    return Promise.reject(refreshErr);
                }
            }
            return Promise.reject(error);
        }
    );
}