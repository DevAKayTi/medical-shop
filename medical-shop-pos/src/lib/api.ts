import axios from 'axios';
import { storageLib } from './storage';

const api = axios.create({
    baseURL: 'http://localhost:8001/api', // Adjust if shop-api runs on a different port/host
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add a request interceptor to append the auth token
api.interceptors.request.use(
    (config) => {
        const token = storageLib.getAuthToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Unauthenticated, clear auth state
            storageLib.logout();
            // Optional: redirect to login page directly if we aren't already there.
            // A common approach is dispatching an event that the app level listens to,
            // or simply relying on the next page reload / route change.
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
