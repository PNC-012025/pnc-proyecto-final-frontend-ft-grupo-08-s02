import api from './api';
import endpoints from '../utils/endpoints';

export const asociarUsuarioConMateria = (idUsuario: string, idMateria: string) =>
    api.post<void>(endpoints.usuarioMateria, { idUsuario, idMateria });

export const eliminarAsociacion = (idUsuario: string, idMateria: string) =>
    api.delete<void>(`${endpoints.usuarioMateria}/${idUsuario}/${idMateria}`);

export const listarMateriasPorUsuario = (idUsuario: string) =>
    api.get<any[]>(`${endpoints.usuarioMateria}/usuario/${idUsuario}`);

export const listarUsuariosPorMateria = (idMateria: string) =>
    api.get<any[]>(`${endpoints.usuarioMateria}/materia/${idMateria}`);
