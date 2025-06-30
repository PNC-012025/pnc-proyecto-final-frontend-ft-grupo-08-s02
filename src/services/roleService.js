import api from './api';
import endpoints from '../utils/endpoints';
export const listarRoles = () => api.get(endpoints.roles);
export const obtenerRol = (name) => api.get(`${endpoints.roles}/${name}`);
