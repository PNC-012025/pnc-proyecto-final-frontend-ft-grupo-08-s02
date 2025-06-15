
import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { UsuarioLoginDTO, Usuario } from '../types';

interface AuthContextProps {
    user: Usuario | null;
    login: (data: UsuarioLoginDTO) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    login: async () => {},
    logout: () => {},
});

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        const data = localStorage.getItem('user');
        if (data) {
            setUser(JSON.parse(data));
        }
        setLoading(false); 
    }, []);

            {/*const login = async (credentials: UsuarioLoginDTO) => {
        const resp: LoginResponse = await loginService(credentials);
        localStorage.setItem('token', resp.token);
        localStorage.setItem('user', JSON.stringify(resp.usuario));
        setUser(resp.usuario); 
    };*/}

    const login = async (credentials: UsuarioLoginDTO) => {
        const { email, password } = credentials;

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

        if (email === 'estudiante@uca.edu.sv' && password === '1234') {
            const fakeUser: Usuario = {
                id: '2',
                nombre: 'Estudiante',
                apellido: 'Ejemplo',
                email,
                rol: 'ESTUDIANTE',
                codigoUsuario: 'EST001',
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

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen text-[#003c71] font-semibold text-lg">
                Cargando sesión...
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
