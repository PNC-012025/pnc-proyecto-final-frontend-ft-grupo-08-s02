import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Usuario, UsuarioLoginDTO } from '../types';
import api from '../services/api';
import { login as loginRequest } from '../services/authService';

export interface AuthContextProps {
  user: Usuario | null;
  signin: (creds: UsuarioLoginDTO) => Promise<void>;
  signout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true); // ← NUEVO
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payloadBase64 = token.split('.')[1];
          const decodedPayload = JSON.parse(atob(payloadBase64));
          const userId = decodedPayload.id;

          const userRes = await api.get(`/api/usuarios/data/${userId}`);
          const user = userRes.data;
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
        } catch (err) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          if (location.pathname !== '/login') navigate('/login');
        }
      }
      setLoading(false); // ← MARCA QUE TERMINÓ
    };

    verifyToken();
  }, []);

  const signin = async (creds: UsuarioLoginDTO) => {
    try {
      const res = await loginRequest(creds);
      if (res.data?.state && res.data?.result) {
        const token = res.data.result;
        localStorage.setItem('token', token);

        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        const userId = decodedPayload.id;

        const userRes = await api.get(`/api/usuarios/data/${userId}`);
        const user = userRes.data;

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
    <AuthContext.Provider value={{ user, signin, signout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
