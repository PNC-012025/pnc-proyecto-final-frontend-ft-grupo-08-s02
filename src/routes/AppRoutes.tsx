import React from 'react';
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';

import Login from '../pages/Login/Login';
import useAuth from '../hooks/useAuth';
import Layout from '../layout/Layout';
import DashboardEstudiante from '../pages/Dashboard/DashboardEstudiante';
import DashboardEncargado from '../pages/Dashboard/DashboardEncargado';
import RegistrosPage from '../pages/Registros/RegistrosPage';
import RegistroPageEncargado from '../pages/Registros/RegistroPageEncargado';
import ValidacionesPage from '../pages/Validaciones/Validaciones';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" replace />;
};

const DashboardRouter: React.FC = () => {
    const { user } = useAuth();
    if (!user) return null;
    return user.rol === 'ENCARGADO'
        ? <DashboardEncargado />
        : <DashboardEstudiante />;
};

const AppRoutes: React.FC = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route
                path="/dashboard/*"
                element={
                    <PrivateRoute>
                        <Layout />
                    </PrivateRoute>
                }
            >
                {/* Página principal según rol */}
                <Route index element={<DashboardRouter />} />

                {/* Rutas compartidas */}
                <Route path="registros" element={<RegistrosPage />} />

                {/* Encargado */}
                <Route path="validaciones" element={<ValidacionesPage />} />
                <Route path="historico" element={<RegistroPageEncargado />} />

                {/* Cualquier otra → al login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    </BrowserRouter>
);

export default AppRoutes;
