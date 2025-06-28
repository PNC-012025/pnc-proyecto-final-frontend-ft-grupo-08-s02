import api from './api';
import endpoints from '../utils/endpoints';
import type { UsuarioDTO, Usuario } from '../types';

export const listarUsuarios = () =>
    api.get<Usuario[]>(endpoints.usuarios);

export const buscarUsuarioPorCodigo = (codigo: string) =>
    api.get<Usuario>(`${endpoints.usuarioByCodigo}/${codigo}`);

export const listarUsuariosPorRol = (idRol: string) =>
    api.get<Usuario[]>(`${endpoints.usuariosByRol}?idRol=${idRol}`);

export const listarUsuariosPorMateria = (idMateria: string) =>
    api.get<Usuario[]>(`${endpoints.usuariosByMateria}?idMateria=${idMateria}`);

export const crearUsuario = (usuario: UsuarioDTO) =>
    api.post<Usuario>(endpoints.saveUsuario, usuario);

export const actualizarUsuario = (id: string, usuario: UsuarioDTO) =>
    api.put<Usuario>(`${endpoints.updateUsuario}/${id}`, usuario);

export const eliminarUsuario = (id: string) =>
    api.delete<void>(`${endpoints.deleteUsuario}/${id}`);
