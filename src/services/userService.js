import api from './api';
import endpoints from '../utils/endpoints';
// Obtener todos los usuarios
export const listarUsuarios = () => {
    return api.get(endpoints.usuarios);
};
// Crear usuario
export const crearUsuario = (dto) => {
    return api.post(endpoints.saveUsuario, dto);
};
// Actualizar usuario
export const actualizarUsuario = (idUsuario, dto) => {
    return api.put(`${endpoints.updateUsuario}/${idUsuario}`, dto);
};
// Eliminar usuario
export const eliminarUsuario = (idUsuario) => {
    return api.delete(`${endpoints.deleteUsuario}/${idUsuario}`);
};
