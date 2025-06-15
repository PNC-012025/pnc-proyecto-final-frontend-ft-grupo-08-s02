import React from 'react';

const ValidacionesPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#003c71]">Validaciones pendientes</h2>
                <select className="border px-3 py-1 rounded">
                    <option value="">Filtrar por semana</option>
                    <option value="23">Semana 23</option>
                    <option value="24">Semana 24</option>
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700 text-left">
                            <th className="px-4 py-2">Usuario</th>
                            <th className="px-4 py-2">Semana</th>
                            <th className="px-4 py-2">Fecha</th>
                            <th className="px-4 py-2">Estado</th>
                            <th className="px-4 py-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="px-4 py-2">Juan Pérez</td>
                            <td className="px-4 py-2">24</td>
                            <td className="px-4 py-2">2025-06-08</td>
                            <td className="px-4 py-2">Pendiente</td>
                            <td className="px-4 py-2 space-x-2">
                                <button className="text-sm text-green-600 hover:underline">Aprobar</button>
                                <button className="text-sm text-red-600 hover:underline">Rechazar</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ValidacionesPage;