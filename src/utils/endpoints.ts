// src/utils/endpoints.ts

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default {
    // Autenticación
    auth: '/api/auth/login',

    // Usuarios
    usuarios: '/api/usuarios/list',
    usuarioByCodigo: '/api/usuarios/codigo',       
    usuariosByRol: '/api/usuarios/rol',             
    usuariosByMateria: '/api/usuarios/materia',   
    saveUsuario: '/api/save',                      
    updateUsuario: '/api/usuarios/update',          
    deleteUsuario: '/api/usuarios/delete',          

    // Roles
    roles: '/api/roles',

    // Materias
    materias: '/api/materias',
    updateMateria: '/api/materias',                 
    deleteMateria: '/api/materias',                 

    // Actividades
    actividades: '/api/actividades',
    actividadesByTipo: '/api/actividades/tipo',    

    // Formularios
    formularios: '/api/formularios',
    formulariosByUsuario: '/api/formularios/usuario', 

    // Registros de hora
    registros: '/api/registros/horas',
    registrosByUsuarioFecha: '/api/registros/manage/horas/usuario/fecha', 

    // Validaciones
    validaciones: '/api/validaciones',
    pendientes: '/api/validaciones/formularios-pendientes',
    validacionesByEnc: '/api/validaciones/encargado', // + `/:idEncargado`

    // Asociación Usuario ↔ Materia
    usuarioMateria: '/api/usuario-materias',

    // Base URL para Axios
    baseURL,
};
