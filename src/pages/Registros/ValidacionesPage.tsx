import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

interface RegistroHora {
    id: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    actividad: string;
    aula: string;
    horasEfectivas: number;
    estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
    estudianteId: string;
}

const ValidacionesPage: React.FC = () => {
    const [registros, setRegistros] = useState<RegistroHora[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        const data = localStorage.getItem('registros');
        if (data) {
            setRegistros(JSON.parse(data));
        }
    }, []);

    const actualizarEstado = (id: number, nuevoEstado: 'APROBADO' | 'RECHAZADO') => {
        const nuevosRegistros = registros.map(reg =>
            reg.id === id ? { ...reg, estado: nuevoEstado } : reg
        );
        setRegistros(nuevosRegistros);
        localStorage.setItem('registros', JSON.stringify(nuevosRegistros));
    };

    return (
        <div className="space-y-6 p-4">
            <h2 className="text-2xl font-bold text-[#003c71]">Validaciones de Registros</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700 text-left">
                            <th className="px-4 py-2">Estudiante</th>
                            <th className="px-4 py-2">Fecha</th>
                            <th className="px-4 py-2">Hora Inicio</th>
                            <th className="px-4 py-2">Hora Fin</th>
                            <th className="px-4 py-2">Actividad</th>
                            <th className="px-4 py-2">Aula</th>
                            <th className="px-4 py-2">Horas</th>
                            <th className="px-4 py-2">Estado</th>
                            <th className="px-4 py-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registros
                            .filter(reg => reg.estado === 'PENDIENTE')
                            .map(reg => (
                                <tr key={reg.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2">{reg.estudianteId}</td>
                                    <td className="px-4 py-2">{reg.fecha}</td>
                                    <td className="px-4 py-2">{reg.horaInicio}</td>
                                    <td className="px-4 py-2">{reg.horaFin}</td>
                                    <td className="px-4 py-2">{reg.actividad}</td>
                                    <td className="px-4 py-2">{reg.aula}</td>
                                    <td className="px-4 py-2">{reg.horasEfectivas}</td>
                                    <td className="px-4 py-2">{reg.estado}</td>
                                    <td className="px-4 py-2 space-x-2">
                                        <button
                                            className="text-green-600 hover:underline"
                                            onClick={() => actualizarEstado(reg.id, 'APROBADO')}
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                        <button
                                            className="text-red-600 hover:underline"
                                            onClick={() => actualizarEstado(reg.id, 'RECHAZADO')}
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ValidacionesPage;
