import api from './api';
import endpoints from '../utils/endpoints';
import type { ActividadDTO, Actividad } from '../types';

export const crearActividad = (actividad: ActividadDTO) =>
    api.post<Actividad>(endpoints.actividades, actividad);

export const listarActividades = () =>
    api.get<Actividad[]>(endpoints.actividades);

export const actualizarActividad = (id: string, actividad: ActividadDTO) =>
    api.put<Actividad>(`${endpoints.actividades}/${id}`, actividad);

export const eliminarActividad = (id: string) =>
    api.delete<void>(`${endpoints.actividades}/${id}`);

// Específico
export const listarPorTipo = (tipo: 'SOCIAL' | 'REMUNERADA') =>
    api.get<Actividad[]>(`${endpoints.actividades}/tipo/${tipo}`);
