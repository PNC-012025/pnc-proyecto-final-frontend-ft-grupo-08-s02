import api from './api';
import endpoints from '../utils/endpoints';
import type { UsuarioLoginDTO, LoginResponse } from '../types';

export const login = (data: UsuarioLoginDTO): Promise<LoginResponse> =>
    api.post(endpoints.auth, data).then(res => res.data);