import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login/Login';
import useAuth from '../hooks/useAuth';
import Layout from '../layout/Layout';
import DashboardEstudiante from '../pages/Dashboard/DashboardEstudiante';
import DashboardEncargado from '../pages/Dashboard/DashboardEncargado';
import RegistrosPage from '../pages/Registros/RegistrosPage';
import RegistroPageEncargado from '../pages/Registros/RegistroPageEncargado';
import ValidacionesPage from '../pages/Validaciones/Validaciones';
const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading)
        return _jsx("div", { className: "p-8 text-center", children: "Cargando..." });
    return user ? children : _jsx(Navigate, { to: "/login", replace: true });
};
const DashboardRouter = () => {
    const { user } = useAuth();
    if (!user)
        return null;
    return user.rol === 'ENCARGADO'
        ? _jsx(DashboardEncargado, {})
        : _jsx(DashboardEstudiante, {});
};
const AppRoutes = () => (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsxs(Route, { path: "/dashboard/*", element: _jsx(PrivateRoute, { children: _jsx(Layout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(DashboardRouter, {}) }), _jsx(Route, { path: "registros", element: _jsx(RegistrosPage, {}) }), _jsx(Route, { path: "validaciones", element: _jsx(ValidacionesPage, {}) }), _jsx(Route, { path: "historico", element: _jsx(RegistroPageEncargado, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/login", replace: true }) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/login", replace: true }) })] }));
export default AppRoutes;
