import api from './api';
import endpoints from '../utils/endpoints';
export const listarActividades = () => api.get(endpoints.actividades);
export const listarActividadesPorTipo = (tipo) => api.get(`${endpoints.actividadesByTipo}/${tipo}`);
export const crearActividad = (actividad) => api.post(endpoints.actividades, actividad);
export const actualizarActividad = (id, actividad) => api.put(`${endpoints.actividades}/${id}`, actividad);
export const eliminarActividad = (id) => api.delete(`${endpoints.actividades}/${id}`);
