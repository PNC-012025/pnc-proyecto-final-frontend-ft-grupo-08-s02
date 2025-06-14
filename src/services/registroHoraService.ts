import api from './api';
import endpoints from '../utils/endpoints';
import type { RegistroDTO, RegistroHora } from '../types';

export const crearRegistroHora = (data: RegistroDTO) =>
    api.post<RegistroHora>(endpoints.registrosHora, data);

export const obtenerRegistroPorId = (id: string) =>
    api.get<RegistroHora>(`${endpoints.registrosHora}/${id}`);

export const listarRegistrosPorFormulario = (idFormulario: string) =>
    api.get<RegistroHora[]>(`${endpoints.registrosHora}/formulario/${idFormulario}`);

export const listarRegistrosPorUsuario = (idUsuario: string) =>
    api.get<RegistroHora[]>(`${endpoints.registrosHora}/usuario/${idUsuario}`);

export const actualizarRegistroHora = (id: string, data: Partial<RegistroDTO>) =>
    api.put<RegistroHora>(`${endpoints.registrosHora}/${id}`, data);

export const eliminarRegistro = (id: string) =>
    api.delete<void>(`${endpoints.registrosHora}/${id}`);
