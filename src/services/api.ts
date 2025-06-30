import axios from 'axios';
import endpoints from '../utils/endpoints';

// Función para verificar si el token es válido
const isTokenValid = (): boolean => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('⚠️ No token found');
        return false;
    }
    
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        const expirationTime = decodedPayload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        
        console.log('🔍 Token validation:', {
            expirationTime: new Date(expirationTime).toISOString(),
            currentTime: new Date(currentTime).toISOString(),
            isValid: currentTime < expirationTime,
            timeLeft: Math.floor((expirationTime - currentTime) / 1000 / 60) + ' minutes'
        });
        
        return currentTime < expirationTime;
    } catch (error) {
        console.error('❌ Error parsing token:', error);
        return false;
    }
};

const api = axios.create({
    baseURL: endpoints.baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    const tokenValid = isTokenValid();
    
    console.log('🔍 API Request Debug:', {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        tokenValid: tokenValid,
        tokenLength: token?.length || 0,
        tokenStart: token?.substring(0, 20) + '...' || 'none'
    });
    
    if (token && tokenValid && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Token added to request headers');
    } else {
        console.warn('⚠️ No valid token found in localStorage');
        if (token && !tokenValid) {
            console.warn('⚠️ Token is expired, clearing localStorage...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    }
    return config;
});

// Interceptor de respuesta para manejar errores de autenticación
api.interceptors.response.use(
    (response) => {
        console.log('✅ API Response Success:', response.config.url);
        return response;
    },
    (error) => {
        console.error('❌ API Response Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });
        
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Token expirado o inválido
            console.warn('🔐 Error de autenticación detectado:', error.response?.status);
            
            // Solo limpiar datos de sesión y redirigir si no estamos en una operación de edición
            // y no estamos ya en la página de login
            const currentPath = window.location.pathname;
            const isEditingOperation = currentPath.includes('/dashboard') && 
                                     (error.config?.method === 'put' || error.config?.method === 'post');
            
            if (!isEditingOperation && currentPath !== '/login') {
                console.log('🔄 Limpiando sesión y redirigiendo a login...');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
