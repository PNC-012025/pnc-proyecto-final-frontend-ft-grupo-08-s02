import api from './api'
import endpoints from '../utils/endpoints'
import type { Usuario, UsuarioDTO } from '../types'


export const listarUsuarios = () => {
    return api.get<Usuario[]>(endpoints.usuarios)
}


export const obtenerUsuarioPorCodigo = (codigo: string) => {
    return api.get<Usuario>(`${endpoints.usuarioByCodigo}/${codigo}`)
}


export const listarUsuariosPorRol = (rolNombre: string) => {
    return api.get<Usuario[]>(`${endpoints.usuariosByRol}/${rolNombre}`)
}


export const listarUsuariosPorMateria = (idMateria: string) => {
    return api.get<Usuario[]>(`${endpoints.usuariosByMateria}/${idMateria}`)
}


export const crearUsuario = (dto: UsuarioDTO) => {
    return api.post<Usuario>(endpoints.saveUsuario, dto)
}


export const actualizarUsuario = (idUsuario: string, dto: UsuarioDTO) => {
    return api.put<Usuario>(`${endpoints.updateUsuario}/${idUsuario}`, dto)
}


export const eliminarUsuario = (idUsuario: string) => {
    return api.delete<void>(`${endpoints.deleteUsuario}/${idUsuario}`)
}
