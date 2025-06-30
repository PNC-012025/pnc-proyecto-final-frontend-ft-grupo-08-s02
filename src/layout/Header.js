import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Menu, Bell, UserCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useLayout from '../hooks/useLayout';
import useAuth from '../hooks/useAuth';
const Header = () => {
    const { toggleSidebar } = useLayout();
    const { user, signout } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotif, setShowNotif] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const notifRef = useRef(null);
    const userRef = useRef(null);
    // Carga y refresca notificaciones
    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('registros') || '[]');
        let nots;
        if (user?.rol === 'ENCARGADO') {
            nots = data.filter(r => r.estado === 'PENDIENTE');
        }
        else {
            nots = data.filter(r => r.estudianteId === user?.nombre && r.estado !== 'PENDIENTE');
        }
        setNotifications(nots);
    }, [user]);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target))
                setShowNotif(false);
            if (userRef.current && !userRef.current.contains(e.target))
                setShowUserMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const handleNotificationClick = (id) => {
        // Marcar como visto (remover de lista)
        setNotifications(prev => prev.filter(n => n.id !== id));
        const seen = JSON.parse(localStorage.getItem('seenNotificaciones') || '[]');
        localStorage.setItem('seenNotificaciones', JSON.stringify([...seen, id]));
        setShowNotif(false);
        if (user?.rol === 'ENCARGADO') {
            navigate('/dashboard/validaciones');
        }
        else {
            navigate('/dashboard/registros');
        }
    };
    // Filtrar ya vistas
    const filteredNotifications = notifications.filter(n => {
        const seen = JSON.parse(localStorage.getItem('seenNotificaciones') || '[]');
        return !seen.includes(n.id);
    });
    return (_jsxs("header", { className: "sticky top-0 z-20 w-full bg-[rgb(0,60,113)] text-white shadow flex items-center justify-between px-6 py-3", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("button", { onClick: toggleSidebar, className: "p-2 hover:bg-white/20 rounded-full transition", children: _jsx(Menu, { size: 24 }) }), _jsx("h1", { className: "ml-4 text-xl font-semibold", children: "REHOSAR" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: "relative", ref: notifRef, children: [_jsxs("button", { onClick: () => setShowNotif(v => !v), className: "relative p-2 hover:bg-white/20 rounded-full transition", children: [_jsx(Bell, { size: 24 }), filteredNotifications.length > 0 && (_jsx("span", { className: "absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full", children: filteredNotifications.length }))] }), showNotif && (_jsxs("div", { className: "absolute right-0 mt-2 w-80 bg-white text-black rounded-lg shadow-lg overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-2 bg-[rgb(0,60,113)] text-white", children: [_jsx("span", { className: "font-semibold", children: "Notificaciones" }), _jsx("button", { onClick: () => setShowNotif(false), className: "hover:opacity-80", children: _jsx(XCircle, { size: 18 }) })] }), _jsxs("ul", { className: "max-h-60 overflow-y-auto", children: [filteredNotifications.map(n => (_jsxs("li", { onClick: () => handleNotificationClick(n.id), className: "flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition cursor-pointer", children: [user?.rol === 'ENCARGADO' ? (_jsx(Clock, { className: "text-blue-600", size: 20 })) : n.estado === 'APROBADO' ? (_jsx(CheckCircle2, { className: "text-green-600", size: 20 })) : (_jsx(XCircle, { className: "text-red-600", size: 20 })), _jsx("div", { className: "flex-1 text-sm", children: user?.rol === 'ENCARGADO'
                                                            ? `Registro ${n.estudianteId} pendiente`
                                                            : `Tu registro fue ${n.estado.toLowerCase()}` }), _jsx("span", { className: "text-xs text-gray-500", children: "Ver" })] }, n.id))), filteredNotifications.length === 0 && (_jsx("li", { className: "px-4 py-3 text-center text-gray-500", children: "Sin notificaciones nuevas" }))] })] }))] }), _jsxs("div", { className: "relative", ref: userRef, children: [_jsx("button", { onClick: () => setShowUserMenu(v => !v), className: "p-2 hover:bg-white/20 rounded-full transition", children: _jsx(UserCircle, { size: 24 }) }), showUserMenu && (_jsxs("div", { className: "absolute right-0 mt-3 w-48 bg-white text-black rounded-lg shadow-lg overflow-hidden", children: [_jsxs("div", { className: "px-4 py-3 flex items-center gap-3 border-b border-gray-200", children: [_jsx(UserCircle, { size: 25, className: "text-gray-600" }), _jsxs("div", { className: "flex flex-col text-sm", children: [_jsx("span", { className: "font-medium text-gray-800", children: user?.nombre }), _jsx("span", { className: "text-gray-600 break-all text-xs", children: user?.correo })] })] }), _jsxs("button", { onClick: signout, className: "w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition", children: [_jsx(XCircle, { size: 16, className: "text-red-600" }), _jsx("span", { className: "text-sm text-red-600", children: "Cerrar sesi\u00F3n" })] })] }))] })] })] }));
};
export default Header;
