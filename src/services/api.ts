import axios from 'axios';
import endpoints from '../utils/endpoints';

const api = axios.create({
    baseURL: endpoints.baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor de respuesta para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Token expirado o inválido
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Solo redirigir si no estamos ya en la página de login
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
