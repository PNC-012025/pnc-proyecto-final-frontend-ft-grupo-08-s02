import api from './api';
import endpoints from '../utils/endpoints';
export const listarFormulariosPendientes = () => api.get(endpoints.pendientes);
export const listarValidacionesPorEncargado = (idEncargado) => api.get(`${endpoints.validacionesByEnc}/${idEncargado}`);
export const crearValidacion = (data) => api.post(endpoints.validaciones, data);
export const actualizarValidacion = (id, data) => api.put(`${endpoints.validaciones}/${id}`, data);
export const rechazarFormulario = (idFormulario, observacion) => api.post(`${endpoints.validaciones}/rechazar?idFormulario=${idFormulario}&observacion=${encodeURIComponent(observacion)}`);
