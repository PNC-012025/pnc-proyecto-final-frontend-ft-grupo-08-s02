import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { Book, UserCheck, Clock, LogOut } from 'lucide-react'
import ucaBg from '../assets/sidebar/uca.png'

const Sidebar: React.FC = () => {
    const { user, signout } = useAuth()
    const { pathname } = useLocation()

    const isActive = (path: string) =>
        pathname === path || pathname.startsWith(path)

    return (
        <aside className="w-64 bg-white border-r h-full flex flex-col">
            <div className="p-4 flex items-center gap-2">
                <img src={ucaBg} alt="UCA" className="h-8" />
                <span className="font-bold text-lg">PNC</span>
            </div>
            <nav className="flex-1 px-4 space-y-2">
                <Link
                    to="/dashboard"
                    className={`flex items-center gap-2 p-2 rounded ${isActive('/dashboard') ? 'bg-blue-100' : 'hover:bg-gray-100'
                        }`}
                >
                    <Book size={16} /> Dashboard
                </Link>
                {user?.rol === 'ENCARGADO' && (
                    <Link
                        to="/dashboard/encargado"
                        className={`flex items-center gap-2 p-2 rounded ${isActive('/dashboard/encargado') ? 'bg-blue-100' : 'hover:bg-gray-100'
                            }`}
                    >
                        <UserCheck size={16} /> Gestión usuarios
                    </Link>
                )}
                {user?.rol === 'INSTRUCTOR_NORMAL' && (
                    <Link
                        to="/dashboard/estudiante"
                        className={`flex items-center gap-2 p-2 rounded ${isActive('/dashboard/estudiante') ? 'bg-blue-100' : 'hover:bg-gray-100'
                            }`}
                    >
                        <Clock size={16} /> Mis registros
                    </Link>
                )}
            </nav>
            <button
                onClick={signout}
                className="m-4 p-2 text-red-600 flex items-center gap-2 hover:bg-gray-100 rounded"
            >
                <LogOut size={16} /> Cerrar sesión
            </button>
        </aside>
    )
}

export default Sidebar
