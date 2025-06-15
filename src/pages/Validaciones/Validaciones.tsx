import React from 'react';

const ValidacionesPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#003c71]">Formularios por validar</h2>
                <select className="border border-gray-300 rounded px-3 py-1 text-sm">
                    <option>Esta semana</option>
                    <option>Semana pasada</option>
                    <option>Otro usuario</option>
                </select>
            </div>

            <table className="min-w-full bg-white rounded shadow overflow-hidden">
                <thead className="bg-[#003c71] text-white">
                    <tr>
                        <th className="text-left px-4 py-2">Estudiante</th>
                        <th className="text-left px-4 py-2">Semana</th>
                        <th className="text-left px-4 py-2">Estado</th>
                        <th className="text-left px-4 py-2">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-t">
                        <td className="px-4 py-2">Juan Pérez</td>
                        <td className="px-4 py-2">10 - 14 Junio</td>
                        <td className="px-4 py-2">Pendiente</td>
                        <td className="px-4 py-2 flex gap-2">
                            <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">
                                Aprobar
                            </button>
                            <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">
                                Rechazar
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default ValidacionesPage;