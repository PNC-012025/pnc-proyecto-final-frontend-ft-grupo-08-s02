import React from 'react';
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';

import Login from '../pages/Login/Login';
import Dashboard from '../pages/Dashboard/Dashboard';
import useAuth from '../hooks/useAuth';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({
    children,
}) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route
                path="/dashboard/*"
                element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    </BrowserRouter>
);

export default AppRoutes;
