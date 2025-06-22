import axios from 'axios';
import endpoints from '../utils/endpoints';

const api = axios.create({
    baseURL: endpoints.baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para añadir token si existe
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
