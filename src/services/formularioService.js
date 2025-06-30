import api from './api';
import endpoints from '../utils/endpoints';
export const listarFormulariosPorUsuario = (idUsuario) => api.get(`${endpoints.formulariosByUsuario}/${idUsuario}`);
export const obtenerFormulario = (id) => api.get(`${endpoints.formularios}/${id}`);
export const crearFormulario = (data) => api.post(endpoints.formularios, data);
export const actualizarFormulario = (id, data) => api.put(`${endpoints.formularios}/${id}`, data);
export const eliminarFormulario = (id) => api.delete(`${endpoints.formularios}/${id}`);
