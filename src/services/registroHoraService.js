import api from './api';
import endpoints from '../utils/endpoints';
export const listarRegistros = () => api.get(endpoints.registros);
export const listarRegistrosPorUsuarioYFechas = (idUsuario, fechaInicio, fechaFin) => api.get(`${endpoints.registrosByUsuarioFecha}?idUsuario=${idUsuario}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
export const obtenerRegistro = (id) => api.get(`${endpoints.registros}/${id}`);
export const crearRegistroHora = (data) => api.post(endpoints.registros, data);
export const actualizarRegistroHora = (id, data) => api.put(`${endpoints.registros}/${id}`, data);
export const eliminarRegistro = (id) => api.delete(`${endpoints.registros}/${id}`);
