import api from './api';
import endpoints from '../utils/endpoints';
import type { UsuarioDTO, Usuario } from '../types';

export const crearUsuario = (usuario: UsuarioDTO) =>
    api.post<Usuario>(endpoints.usuarios, usuario);

export const obtenerUsuarioPorId = (id: string) =>
    api.get<Usuario>(`${endpoints.usuarios}/${id}`);

export const listarUsuarios = () =>
    api.get<Usuario[]>(endpoints.usuarios);

export const actualizarUsuario = (id: string, usuario: UsuarioDTO) =>
    api.put<Usuario>(`${endpoints.usuarios}/${id}`, usuario);

export const eliminarUsuario = (id: string) =>
    api.delete<void>(`${endpoints.usuarios}/${id}`);

// Específicos
export const obtenerUsuariosPorRol = (rol: string) =>
    api.get<Usuario[]>(`${endpoints.usuarios}/rol/${rol}`);

export const buscarPorCodigo = (codigo: string) =>
    api.get<Usuario[]>(`${endpoints.usuarios}/codigo/${codigo}`);

export const listarUsuariosPorMateria = (idMateria: string) =>
    api.get<Usuario[]>(`${endpoints.usuarios}/materia/${idMateria}`);
