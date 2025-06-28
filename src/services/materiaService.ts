import api from './api';
import endpoints from '../utils/endpoints';
import type { MateriaDTO, Materia } from '../types';

export const listarMaterias = () =>
    api.get<Materia[]>(endpoints.materias);

export const crearMateria = (nombre: string) =>
    api.post<Materia>(endpoints.materias, { nombre });

export const actualizarMateria = (id: string, nombre: string) =>
    api.put<Materia>(`${endpoints.updateMateria}/${id}`, { nombre });

export const eliminarMateria = (id: string) =>
    api.delete<void>(`${endpoints.deleteMateria}/${id}`);
