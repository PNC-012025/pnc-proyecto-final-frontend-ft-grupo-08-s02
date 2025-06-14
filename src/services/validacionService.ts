import api from './api';
import endpoints from '../utils/endpoints';
import type { ValidacionDTO, Validacion } from '../types';

export const crearValidacion = (data: ValidacionDTO) =>
    api.post<Validacion>(endpoints.validaciones, data);

export const obtenerValidacionPorFormulario = (idFormulario: string) =>
    api.get<Validacion>(`${endpoints.validaciones}/formulario/${idFormulario}`);

export const actualizarEstadoValidacion = (id: string, nuevoEstado: string) =>
    api.patch<Validacion>(`${endpoints.validaciones}/${id}/estado`, { nuevoEstado });

// Específicos
export const listarFormulariosPendientes = () =>
    api.get<Formulario[]>(`${endpoints.validaciones}/pendientes`);

export const listarValidacionesPorEncargado = (idEncargado: string) =>
    api.get<Validacion[]>(`${endpoints.validaciones}/encargado/${idEncargado}`);

export const rechazarFormulario = (idFormulario: string, observacion: string) =>
    api.post(`${endpoints.validaciones}/${idFormulario}/rechazar`, { observacion });
