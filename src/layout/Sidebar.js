import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Book, UserCheck, Clock } from 'lucide-react';
import { LayoutContext } from './Layout';
import ucaBg from '../assets/sidebar/uca.png';
const Sidebar = () => {
    const { user, signout } = useAuth();
    const { pathname } = useLocation();
    const { collapsed } = useContext(LayoutContext);
    const isActive = (path) => path === '/dashboard'
        ? pathname === '/dashboard'
        : pathname.startsWith(path);
    const links = user?.rol === 'ENCARGADO'
        ? [
            { to: '/dashboard', label: 'Inicio', icon: _jsx(Book, { size: 20 }) },
            { to: '/dashboard/validaciones', label: 'Validaciones', icon: _jsx(UserCheck, { size: 20 }) },
            { to: '/dashboard/historico', label: 'Registros', icon: _jsx(Clock, { size: 20 }) },
        ]
        : [
            { to: '/dashboard', label: 'Inicio', icon: _jsx(Book, { size: 20 }) },
            { to: '/dashboard/registros', label: 'Mis Registros', icon: _jsx(Clock, { size: 20 }) },
        ];
    return (_jsxs("aside", { className: `
                bg-white h-full flex flex-col shadow-lg transition-all duration-300
                ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-64'}
            `, children: [_jsxs("div", { className: "relative h-40 bg-cover bg-center", style: { backgroundImage: `url(${ucaBg})` }, children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" }), _jsxs("div", { className: "absolute bottom-3 left-4 text-white", children: [_jsx("p", { className: "font-bold", children: user?.nombre }), _jsxs("p", { className: "text-xs flex items-center gap-1", children: [_jsx("span", { className: "material-icons text-sm", children: "Email: " }), user?.correo] })] })] }), _jsx("nav", { className: "flex-1 mt-4", children: links.map(({ to, label, icon }) => {
                    const active = isActive(to);
                    return (_jsxs(Link, { to: to, className: `
                                flex items-center gap-3 px-5 py-3 text-base font-medium transition
                                ${active
                            ? 'bg-white text-[rgb(0,60,113)] border-l-4 border-[rgb(0,60,113)]'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-[rgb(0,60,113)]'}
                            `, children: [icon, label] }, to));
                }) })] }));
};
export default Sidebar;
