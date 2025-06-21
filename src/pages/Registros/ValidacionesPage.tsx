// src/pages/Validaciones/ValidacionesPage.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import type { RegistroHora, Usuario } from '../../types';

const ValidacionesPage: React.FC = () => {
    const { user } = useAuth();
    // Cargar todos los registros
    const [registros, setRegistros] = useState<RegistroHora[]>([]);
    // Cargar lista de usuarios para obtener nombres
    const [usuarios, setUsuarios] = useState<Usuario[]>(() =>
        JSON.parse(localStorage.getItem('usuarios') || '[]')
    );
    const [filterEstudiante, setFilterEstudiante] = useState<string>('all');

    useEffect(() => {
        const data = localStorage.getItem('registros');
        if (data) {
            setRegistros(JSON.parse(data));
        }
    }, []);

    // Obtiene nombre completo de un usuario por su id
    const getNombreEstudiante = (id: string) => {
        const u = usuarios.find(u => u.id === id);
        return u ? `${u.nombre} ${u.apellido}` : id;
    };

    // IDs únicos de estudiantes con registros
    const estudiantesUnicos = Array.from(new Set(registros.map(r => r.estudianteId)));

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterEstudiante(e.target.value);
    };

    const actualizarEstado = (id: number, nuevoEstado: 'APROBADO' | 'RECHAZADO') => {
        const nuevos = registros.map(r =>
            r.id === id ? { ...r, estado: nuevoEstado } : r
        );
        setRegistros(nuevos);
        localStorage.setItem('registros', JSON.stringify(nuevos));
    };

    // Filtrar solo pendientes y por estudiante seleccionado
    const registrosFiltrados = registros.filter(r =>
        r.estado === 'PENDIENTE' &&
        (filterEstudiante === 'all' || r.estudianteId === filterEstudiante)
    );

    return (
        <div className="space-y-6 p-4">
            <h2 className="text-2xl font-bold text-[#003c71]">Validaciones de Registros</h2>

            {/* Selector de estudiante */}
            <div className="flex items-center gap-4">
                <label htmlFor="estudianteSelect" className="font-medium">
                    Filtrar por estudiante:
                </label>
                <select
                    id="estudianteSelect"
                    value={filterEstudiante}
                    onChange={handleFilterChange}
                    className="border rounded px-3 py-1"
                >
                    <option value="all">Todos</option>
                    {estudiantesUnicos.map(id => (
                        <option key={id} value={id}>
                            {getNombreEstudiante(id)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tabla de validaciones */}
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
                            <th className="px-4 py-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrosFiltrados.map(reg => (
                            <tr key={reg.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2">{getNombreEstudiante(reg.estudianteId)}</td>
                                <td className="px-4 py-2">{reg.fecha}</td>
                                <td className="px-4 py-2">{reg.horaInicio}</td>
                                <td className="px-4 py-2">{reg.horaFin}</td>
                                <td className="px-4 py-2">{reg.actividad}</td>
                                <td className="px-4 py-2">{reg.aula}</td>
                                <td className="px-4 py-2">{reg.horasEfectivas}</td>
                                <td className="px-4 py-2 space-x-2">
                                    <button
                                        className="text-green-600 hover:text-green-800"
                                        onClick={() => actualizarEstado(reg.id, 'APROBADO')}
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                    <button
                                        className="text-red-600 hover:text-red-800"
                                        onClick={() => actualizarEstado(reg.id, 'RECHAZADO')}
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {registrosFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-2 text-center text-gray-500">
                                    No hay registros pendientes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ValidacionesPage;
