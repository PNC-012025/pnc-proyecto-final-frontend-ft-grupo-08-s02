const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export default {
    baseURL,
    auth: '/usuarios/login',
    usuarios: '/usuarios',
    roles: '/roles',
    materias: '/materias',
    usuarioMateria: '/usuarios-materias',
    actividades: '/actividades',
    formularios: '/formularios',
    registrosHora: '/registros-hora',
    validaciones: '/validaciones',
};
