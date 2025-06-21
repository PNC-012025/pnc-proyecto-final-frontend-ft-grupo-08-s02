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
    login: async () => { },
    logout: () => { },
});

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (u) setUser(JSON.parse(u));
        setLoading(false);
    }, []);

    const login = async (credentials: UsuarioLoginDTO) => {
        const { email, password } = credentials;

        // Cuenta fija de Encargado
        if (email === 'admin@uca.edu.sv' && password === '1234') {
            const fake: Usuario = {
                id: '1',
                nombre: 'Admin',
                apellido: 'Demo',
                email,
                rol: 'ENCARGADO',
                codigoUsuario: 'ADM001',
            };
            localStorage.setItem('token', 'FAKE-TOKEN');
            localStorage.setItem('user', JSON.stringify(fake));
            setUser(fake);
            return;
        }

        // Cuenta fija de Estudiante de prueba
        if (email === 'estudiante@uca.edu.sv' && password === '1234') {
            const fake: Usuario = {
                id: '2',
                nombre: 'Estudiante',
                apellido: 'Ejemplo',
                email,
                rol: 'ESTUDIANTE',
                codigoUsuario: 'EST001',
            };
            localStorage.setItem('token', 'FAKE-TOKEN');
            localStorage.setItem('user', JSON.stringify(fake));
            setUser(fake);
            return;
        }

        // Cuentas dinámicas
        const usuarios: Usuario[] = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const pwMap: Record<string, string> = JSON.parse(localStorage.getItem('passwords') || '{}');
        const match = usuarios.find(u => u.email === email);
        if (match && pwMap[email] === password) {
            localStorage.setItem('token', 'FAKE-TOKEN');
            localStorage.setItem('user', JSON.stringify(match));
            setUser(match);
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
        return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
