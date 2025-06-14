import api from './api';
import type { UsuarioLoginDTO, LoginResponse } from '../types';

export const login = (data: UsuarioLoginDTO): Promise<LoginResponse> => {
    return api.post(endpoints.auth, data).then(res => res.data);
};