import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Book, UserCheck, Clock, LogOut } from 'lucide-react';

const Sidebar: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => location.pathname.startsWith(path);

    const links = user?.rol === 'ENCARGADO'
        ? [
            { to: '/dashboard', label: 'Inicio', icon: <Book size={20} /> },
            { to: '/validaciones', label: 'Validaciones', icon: <UserCheck size={20} /> },
        ]
        : [
            { to: '/dashboard', label: 'Inicio', icon: <Book size={20} /> },
            { to: '/registros', label: 'Mis Registros', icon: <Clock size={20} /> },
        ];

    return (
        <aside className="w-64 bg-white shadow h-full flex flex-col">
            <div className="p-4 border-b">
                <h1 className="text-lg font-bold text-[#003c71]">REHOSAR</h1>
                <p className="text-sm text-gray-500">{user?.nombre}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {links.map(link => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`flex items-center gap-2 p-2 rounded-md text-sm font-medium transition hover:bg-[#003c71]/10 ${isActive(link.to) ? 'bg-[#003c71] text-white' : 'text-gray-700'
                            }`}
                    >
                        {link.icon}
                        {link.label}
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t">
                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-sm text-red-600 hover:underline"
                >
                    <LogOut size={18} /> Cerrar sesión
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;