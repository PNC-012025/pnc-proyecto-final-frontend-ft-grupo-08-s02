import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen p-6 bg-gray-100">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">
                    Bienvenido, {user?.nombre}
                </h1>
                <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Cerrar sesión
                </button>
            </header>
            <nav className="space-x-4 mb-6">
                <Link to="registros" className="text-indigo-600 hover:underline">
                    Mis Registros
                </Link>
                <Link to="validaciones" className="text-indigo-600 hover:underline">
                    Validaciones
                </Link>
            </nav>
            <main>
                <p className="text-gray-700">Selecciona una opción del menú.</p>
            </main>
        </div>
    );
};

export default Dashboard;
