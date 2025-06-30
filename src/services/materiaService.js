import api from './api';
import endpoints from '../utils/endpoints';
// Obtener todas las materias
export const listarMaterias = () => {
    return api.get(endpoints.materias);
};
// Crear materia
export const crearMateria = (nombreMateria) => {
    return api.post(endpoints.materias, { nombreMateria });
};
// Actualizar materia
export const actualizarMateria = (id, nombreMateria) => {
    return api.put(`${endpoints.updateMateria}/${id}`, { nombreMateria });
};
// Eliminar materia
export const eliminarMateria = (id) => {
    return api.delete(`${endpoints.deleteMateria}/${id}`);
};
