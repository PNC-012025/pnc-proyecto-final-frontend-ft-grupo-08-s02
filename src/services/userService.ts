import api from './api';
import endpoints from '../utils/endpoints';
import type { Usuario, UsuarioDTO } from '../types';

// Obtener todos los usuarios
export const listarUsuarios = () => {
    return api.get<Usuario[]>(endpoints.usuarios);
};

// Obtener usuario por código
export const obtenerUsuarioPorCodigo = (codigo: string) => {
    return api.get<Usuario>(`${endpoints.usuarioByCodigo}/${codigo}`);
};

// Obtener usuarios por rol
export const listarUsuariosPorRol = (rolNombre: string) => {
    return api.get<Usuario[]>(`${endpoints.usuariosByRol}/${rolNombre}`);
};

// Obtener usuarios por materia
export const listarUsuariosPorMateria = (idMateria: string) => {
    return api.get<Usuario[]>(`${endpoints.usuariosByMateria}/${idMateria}`);
};

// Crear usuario
export const crearUsuario = (dto: UsuarioDTO) => {
    return api.post<Usuario>(endpoints.saveUsuario, dto);
};

// Actualizar usuario
export const actualizarUsuario = (idUsuario: string, dto: UsuarioDTO) => {
    return api.put<Usuario>(`${endpoints.updateUsuario}/${idUsuario}`, dto);
};

// Eliminar usuario
export const eliminarUsuario = (idUsuario: string) => {
    return api.delete<void>(`${endpoints.deleteUsuario}/${idUsuario}`);
};
