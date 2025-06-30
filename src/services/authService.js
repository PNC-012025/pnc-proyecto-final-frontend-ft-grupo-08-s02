import api from './api';
import endpoints from '../utils/endpoints';
export function login(creds) {
    return api.post(endpoints.auth, creds);
}
