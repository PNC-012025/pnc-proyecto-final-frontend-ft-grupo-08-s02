import React from 'react';

const RegistrosPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#003c71]">Mis registros</h2>
                <button className="px-4 py-2 bg-[#003c71] text-white rounded hover:bg-[#002955]">+ Nuevo registro</button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700 text-left">
                            <th className="px-4 py-2">Fecha</th>
                            <th className="px-4 py-2">Actividad</th>
                            <th className="px-4 py-2">Horas</th>
                            <th className="px-4 py-2">Estado</th>
                            <th className="px-4 py-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="px-4 py-2">2025-06-01</td>
                            <td className="px-4 py-2">Apoyo biblioteca</td>
                            <td className="px-4 py-2">2.0</td>
                            <td className="px-4 py-2">Pendiente</td>
                            <td className="px-4 py-2 space-x-2">
                                <button className="text-sm text-blue-600 hover:underline">Editar</button>
                                <button className="text-sm text-red-600 hover:underline">Eliminar</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RegistrosPage;