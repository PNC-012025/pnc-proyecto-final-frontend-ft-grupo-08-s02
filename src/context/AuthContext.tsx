import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Usuario, UsuarioLoginDTO } from '../types';
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
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const signin = async (creds: UsuarioLoginDTO) => {
    const res = await loginRequest(creds);
    const token = res.data.result;
    localStorage.setItem('token', token);
    navigate('/dashboard');
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
