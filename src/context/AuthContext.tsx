import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Usuario, UsuarioLoginDTO } from '../types';
import api from '../services/api'; 
import { login as loginRequest } from '../services/authService';

export interface AuthContextProps {
  user: Usuario | null;
  signin: (creds: UsuarioLoginDTO) => Promise<void>;
  signout: () => void;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch {
        setUser(null);
      }
    }
  }, []);

const signin = async (creds: UsuarioLoginDTO) => {
  try {
    const res = await loginRequest(creds);

    if (res.data?.state && res.data?.result) {
      const token = res.data.result;
      localStorage.setItem('token', token);

      // Decodificar el JWT para obtener el id
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      const userId = decodedPayload.id;

      // Llamar al backend para obtener los datos del usuario
      const userRes = await api.get(`/api/usuarios/data/${userId}`);
      const user = userRes.data;

      // Guardar en localStorage y contexto
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      navigate('/dashboard');
    } else {
      throw new Error('Respuesta inválida del servidor');
    }
  } catch (error) {
    console.error('Error de autenticación:', error);
    throw new Error('Autenticación fallida: Credenciales inválidas o error del servidor');
  }
};

  const signout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, signin, signout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;