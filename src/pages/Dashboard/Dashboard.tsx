import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { Clock, FileText, CheckCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-8">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#003c71]">
                        ¡Hola, {user?.nombre}!
                    </h1>
                    <p className="text-gray-600">Bienvenido de nuevo a REHOSAR</p>
                </div>
                <button
                    onClick={logout}
                    className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white font-medium"
                >
                    Cerrar sesión
                </button>
            </header>

            {/* Grid de accesos rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                    to="/registros"
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition group border border-gray-200"
                >
                    <Clock className="text-[#003c71] mb-2 group-hover:scale-110 transition" size={32} />
                    <h3 className="text-lg font-semibold text-gray-800">Mis Registros</h3>
                    <p className="text-sm text-gray-500">Ver y registrar tus horas</p>
                </Link>

                <Link
                    to="/formularios"
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition group border border-gray-200"
                >
                    <FileText className="text-[#003c71] mb-2 group-hover:scale-110 transition" size={32} />
                    <h3 className="text-lg font-semibold text-gray-800">Formularios</h3>
                    <p className="text-sm text-gray-500">Revisa formularios creados</p>
                </Link>

                {user?.rol === 'ENCARGADO' && (
                    <Link
                        to="/validaciones"
                        className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition group border border-gray-200"
                    >
                        <CheckCircle className="text-[#003c71] mb-2 group-hover:scale-110 transition" size={32} />
                        <h3 className="text-lg font-semibold text-gray-800">Validaciones</h3>
                        <p className="text-sm text-gray-500">Valida formularios de estudiantes</p>
                    </Link>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
