import api from './api';
import endpoints from '../utils/endpoints';
export const asociarUsuarioConMateria = (codigoUsuario, nombreMateria) => api.post(endpoints.usuarioMateria, { codigoUsuario, nombreMateria });
export const eliminarAsociacion = (id) => api.delete(`${endpoints.usuarioMateria}/${id}`);
export const listarMateriasPorUsuario = (idUsuario) => api.get(`${endpoints.usuarioMateria}/usuario/${idUsuario}`);
export const listarUsuariosPorMateria = (idMateria) => api.get(`${endpoints.usuarioMateria}/materia/${idMateria}`);
