import axios from 'axios'
import endpoints from '../utils/endpoints'

const api = axios.create({
    baseURL: '', 
    headers: { 'Content-Type': 'application/json' },
    timeout: 10_000,
})

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default api
