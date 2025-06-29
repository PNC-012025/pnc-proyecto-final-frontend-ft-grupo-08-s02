import React, { useState, useEffect, useRef } from 'react'
import { Menu, Bell, UserCircle, XCircle, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useLayout from '../hooks/useLayout'
import useAuth from '../hooks/useAuth'

interface Notification {
    id: number
    mensaje: string
    fecha: string
}

const Header: React.FC = () => {
    const { toggleSidebar } = useLayout()
    const { user, signout } = useAuth()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [open, setOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // ejemplo: cargar notificaciones (vacío por ahora)
        setNotifications([])
    }, [])

    // click fuera para cerrar
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        window.addEventListener('click', handler)
        return () => window.removeEventListener('click', handler)
    }, [])

    return (
        <header className="h-16 bg-white border-b flex items-center px-4 justify-between">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar}>
                    <Menu size={20} />
                </button>
                <Clock size={20} className="text-gray-500" />
            </div>
            <div className="flex items-center gap-4">
                <button className="relative" onClick={() => setOpen(o => !o)}>
                    <Bell size={20} />
                    {notifications.length > 0 && (
                        <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-600 rounded-full" />
                    )}
                </button>
                {open && (
                    <div
                        ref={dropdownRef}
                        className="absolute right-4 top-16 bg-white border rounded shadow-md w-64 p-2"
                    >
                        {notifications.length === 0
                            ? <p className="text-sm text-gray-500">Sin notificaciones</p>
                            : notifications.map(n => (
                                <div key={n.id} className="py-1 border-b last:border-none">
                                    <p className="text-sm">{n.mensaje}</p>
                                    <p className="text-xs text-gray-400">{n.fecha}</p>
                                </div>
                            ))
                        }
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <UserCircle size={24} />
                    <span className="font-medium">{user?.nombre}</span>
                    <button onClick={signout} className="text-red-600 hover:underline">
                        Salir
                    </button>
                </div>
            </div>
        </header>
    )
}
    
    export default Header
