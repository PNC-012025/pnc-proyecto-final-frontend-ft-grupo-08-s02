import api from './api';
import endpoints from '../utils/endpoints';
import type { FormularioDTO, Formulario } from '../types';

export const crearFormulario = (data: FormularioDTO) =>
    api.post<Formulario>(endpoints.formularios, data);

export const obtenerFormularioPorId = (id: string) =>
    api.get<Formulario>(`${endpoints.formularios}/${id}`);

export const listarFormulariosPorUsuario = (idUsuario: string) =>
    api.get<Formulario[]>(`${endpoints.formularios}/usuario/${idUsuario}`);

export const actualizarEstadoFormulario = (id: string, estado: string) =>
    api.patch<Formulario>(`${endpoints.formularios}/${id}/estado`, { estado });

export const eliminarFormulario = (id: string) =>
    api.delete<void>(`${endpoints.formularios}/${id}`);

// Específicos
export const obtenerFormularioSemanaUsuario = (idUsuario: string) =>
    api.get<Formulario>(`${endpoints.formularios}/usuario/${idUsuario}/semana`);

export const verificarSiYaTieneFormularioEstaSemana = (idUsuario: string) =>
    api.get<boolean>(`${endpoints.formularios}/usuario/${idUsuario}/check-semana`);

export const marcarComoValidado = (idFormulario: string, idEncargado: string) =>
    api.post(`${endpoints.formularios}/${idFormulario}/validar`, { idEncargado });
