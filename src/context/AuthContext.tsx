import React, {
    createContext,
    useState,
    useEffect,
} from 'react';
import type { ReactNode } from 'react';
import { login as loginService } from '../services/authService';
import type {
    UsuarioLoginDTO,
    LoginResponse,
    Usuario,
} from '../types';

interface AuthContextProps {
    user: Usuario | null;
    login: (data: UsuarioLoginDTO) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    login: async () => { },
    logout: () => { },
});

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<Usuario | null>(null);

    useEffect(() => {
        const data = localStorage.getItem('user');
        if (data) setUser(JSON.parse(data));
    }, []);

    {/*const login = async (credentials: UsuarioLoginDTO) => {
        const resp: LoginResponse = await loginService(credentials);
        localStorage.setItem('token', resp.token);
        localStorage.setItem('user', JSON.stringify(resp.usuario));
        setUser(resp.usuario); 
    };*/}

    const login = async (credentials: UsuarioLoginDTO) => {
        const { email, password } = credentials;

        // Usuario de prueba (solo frontend)
        if (email === 'admin@uca.edu.sv' && password === '1234') {
            const fakeUser: Usuario = {
                id: '1',
                nombre: 'Admin',
                apellido: 'Demo',
                email,
                rol: 'ENCARGADO',
                codigoUsuario: 'ADM001',
            };

            localStorage.setItem('token', 'FAKE-TOKEN');
            localStorage.setItem('user', JSON.stringify(fakeUser));
            setUser(fakeUser);
            return;
        }

        throw new Error('Credenciales inválidas');
    };


    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
