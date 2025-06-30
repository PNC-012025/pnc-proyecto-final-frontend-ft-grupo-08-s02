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
  updateUser: (updatedUser: Usuario) => void;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
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
          
          // Debug: Ver qué está devolviendo el backend
          console.log('🔍 Debug - Datos del usuario desde backend:', user);
          
          // Mapear el rol correctamente
          let mappedUser = { ...user };
          
          // Si el backend devuelve id_rol en lugar de rol, mapearlo
          if (user.id_rol !== undefined && !user.rol) {
            const roleMap: { [key: number]: string } = {
              1: 'ENCARGADO',
              2: 'INSTRUCTOR_NORMAL', 
              3: 'INSTRUCTOR_REMUNERADO'
            };
            mappedUser.rol = roleMap[user.id_rol] || 'INSTRUCTOR_NORMAL';
            console.log('🔍 Debug - Rol mapeado:', { id_rol: user.id_rol, rol: mappedUser.rol });
          }
          
          // Si el rol sigue siendo undefined, asignar ENCARGADO por defecto para el usuario 1001
          if (!mappedUser.rol && user.idUsuario === '1001') {
            mappedUser.rol = 'ENCARGADO';
            console.log('🔍 Debug - Rol asignado por defecto para usuario 1001:', mappedUser.rol);
          }
          
          localStorage.setItem('user', JSON.stringify(mappedUser));
          setUser(mappedUser);
        } catch (err: any) {
          console.error('Error verificando token:', err);
          
          // Solo limpiar datos de sesión y redirigir si es un error de autenticación real
          // (401 Unauthorized, 403 Forbidden, o token inválido)
          if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            
            if (location.pathname !== '/login') {
              navigate('/login');
            }
          } else if (err.response?.status === 404) {
            // Si el usuario no se encuentra (404), podría ser que se eliminó
            // pero mantenemos la sesión activa por si es un error temporal
            console.warn('Usuario no encontrado, pero manteniendo sesión activa');
          } else if (err.response?.status === 0 || err.code === 'NETWORK_ERROR') {
            // Error de red, mantener la sesión activa
            console.warn('Error de red, manteniendo sesión activa');
          } else {
            // Para otros errores (500, etc.), mantener la sesión activa
            console.warn('Error del servidor, manteniendo sesión activa:', err.response?.status);
          }
        }
      }
      setLoading(false); 
    };

    verifyToken();
  }, [navigate, location.pathname]);

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
        
        // Debug: Ver qué está devolviendo el backend
        console.log('🔍 Debug - Datos del usuario desde backend:', user);
        
        // Mapear el rol correctamente
        let mappedUser = { ...user };
        
        // Si el backend devuelve id_rol en lugar de rol, mapearlo
        if (user.id_rol !== undefined && !user.rol) {
          const roleMap: { [key: number]: string } = {
            1: 'ENCARGADO',
            2: 'INSTRUCTOR_NORMAL', 
            3: 'INSTRUCTOR_REMUNERADO'
          };
          mappedUser.rol = roleMap[user.id_rol] || 'INSTRUCTOR_NORMAL';
          console.log('🔍 Debug - Rol mapeado:', { id_rol: user.id_rol, rol: mappedUser.rol });
        }
        
        // Si el rol sigue siendo undefined, asignar ENCARGADO por defecto para el usuario 1001
        if (!mappedUser.rol && user.idUsuario === '1001') {
          mappedUser.rol = 'ENCARGADO';
          console.log('🔍 Debug - Rol asignado por defecto para usuario 1001:', mappedUser.rol);
        }
        
        localStorage.setItem('user', JSON.stringify(mappedUser));
        setUser(mappedUser);

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

  const updateUser = (updatedUser: Usuario) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, signin, signout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;