import api from './api'
import endpoints from '../utils/endpoints'
import type { UsuarioLoginDTO, LoginResponse } from '../types'


export const loginRequest = (data: UsuarioLoginDTO) =>
    api.post<LoginResponse>(endpoints.auth, data)
