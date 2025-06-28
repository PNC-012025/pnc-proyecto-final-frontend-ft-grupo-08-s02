import api from './api';
import endpoints from '../utils/endpoints';
import type { RegistroDTO, RegistroHora } from '../types';

export const listarRegistros = () =>
    api.get<RegistroHora[]>(endpoints.registros);

export const listarRegistrosPorUsuarioYFechas = (
    idUsuario: string,
    fechaInicio: string,
    fechaFin: string
) =>
    api.get<RegistroHora[]>(
        `${endpoints.registrosByUsuarioFecha}?idUsuario=${idUsuario}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
    );

export const obtenerRegistro = (id: string) =>
    api.get<RegistroHora>(`${endpoints.registros}/${id}`);

export const crearRegistroHora = (data: RegistroDTO) =>
    api.post<RegistroHora>(endpoints.registros, data);

export const actualizarRegistroHora = (id: string, data: Partial<RegistroDTO>) =>
    api.put<RegistroHora>(`${endpoints.registros}/${id}`, data);

export const eliminarRegistro = (id: string) =>
    api.delete<void>(`${endpoints.registros}/${id}`);
