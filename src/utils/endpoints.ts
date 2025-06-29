const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default {
    // --- Autenticación ---
    auth: '/api/auth/login',
    // --- Usuarios ---
    usuarios: '/api/usuarios/list',
    usuarioById: '/api/usuarios/data',
    saveUsuario: '/api/usuarios/save',
    updateUsuario: '/api/usuarios/update',
    deleteUsuario: '/api/usuarios/delete',
    // --- Roles ---
    roles: '/api/roles',
    // --- Materias ---
    materias: '/api/materias',
    updateMateria: '/api/materias',
    deleteMateria: '/api/materias',
    // --- Actividades ---
    actividades: '/api/actividades',
    actividadesByTipo: '/api/actividades/tipo',
    // --- Formularios ---
    formularios: '/api/formularios',
    formulariosByUsuario: '/api/formularios/usuario',
    // --- Registros de hora ---
    registros: '/api/registros/horas',
    registrosByUsuarioFecha: '/api/registros/manage/horas/usuario/fecha',
    // --- Validaciones ---
    validaciones: '/api/validaciones',
    pendientes: '/api/validaciones/formularios-pendientes',
    validacionesByEnc: '/api/validaciones/encargado',
    // --- Asociación Usuario ↔ Materia ---
    usuarioMateria: '/api/usuario-materias',

    // Base URL para todas las peticiones axios
    baseURL,
};
