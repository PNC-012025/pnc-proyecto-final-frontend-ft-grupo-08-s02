import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const RegistrosPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#003c71]">Mis registros</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#003c71] text-white rounded hover:bg-[#00509e]">
                    <Plus size={20} /> Nuevo registro
                </button>
            </div>

            <table className="min-w-full bg-white rounded shadow overflow-hidden">
                <thead className="bg-[#003c71] text-white">
                    <tr>
                        <th className="text-left px-4 py-2">Fecha</th>
                        <th className="text-left px-4 py-2">Hora inicio</th>
                        <th className="text-left px-4 py-2">Hora fin</th>
                        <th className="text-left px-4 py-2">Actividad</th>
                        <th className="text-left px-4 py-2">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-t">
                        <td className="px-4 py-2">2025-06-10</td>
                        <td className="px-4 py-2">08:00</td>
                        <td className="px-4 py-2">12:00</td>
                        <td className="px-4 py-2">Documentación</td>
                        <td className="px-4 py-2 flex gap-2">
                            <button className="text-blue-600 hover:underline">
                                <Pencil size={18} />
                            </button>
                            <button className="text-red-600 hover:underline">
                                <Trash2 size={18} />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default RegistrosPage;