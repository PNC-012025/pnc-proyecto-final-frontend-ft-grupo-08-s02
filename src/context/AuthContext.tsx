import React, { createContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { loginRequest } from '../services/authService'
import api from '../services/api'
import type { UsuarioLoginDTO, Usuario } from '../types'

interface AuthContextValue {
  user: Usuario | null
  signin: (data: UsuarioLoginDTO) => Promise<void>
  signout: () => void
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  signin: async () => { },
  signout: () => { }
})

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null)

  // Al montar, cargamos de localStorage
  useEffect(() => {
    const token = localStorage.getItem('token')
    const usr = localStorage.getItem('user')
    if (token && usr) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`
      setUser(JSON.parse(usr))
    }
  }, [])

  const signin = async (data: UsuarioLoginDTO) => {
    const res = await loginRequest(data)
    const { token, usuario } = res.data
    // Persistimos
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(usuario))
    // Configuramos axios
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    setUser(usuario)
  }

  const signout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common.Authorization
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, signin, signout }}>
      {children}
    </AuthContext.Provider>
  )
}
