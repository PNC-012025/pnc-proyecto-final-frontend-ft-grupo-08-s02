// src/pages/Validaciones/ValidacionesPage.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import type { Usuario } from '../../types';

type RegistroLocal = {
    id: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    actividad: string;
    aula: string;
    horasEfectivas: number;
    estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
    estudianteId: string;
};

const ValidacionesPage: React.FC = () => {
    const { user } = useAuth();

    // todos los registros
    const [registros, setRegistros] = useState<RegistroLocal[]>([]);
    // lista de usuarios para buscar código
    const [usuarios, setUsuarios] = useState<Usuario[]>(() =>
        JSON.parse(localStorage.getItem('usuarios') || '[]')
    );
    const [filterCodigo, setFilterCodigo] = useState<string>('all');

    useEffect(() => {
        const data = localStorage.getItem('registros');
        if (data) setRegistros(JSON.parse(data));
    }, []);

    // dada una fila, devuelve el códigoUsuario del alumno (o el id si no existe)
    const getCodigoEstudiante = (r: RegistroLocal) => {
        const u = usuarios.find(u => u.id === r.estudianteId);
        return u ? u.codigoUsuario : r.estudianteId;
    };

    // lista única de códigos para el dropdown
    const codigosUnicos = Array.from(
        new Set(registros.map(getCodigoEstudiante))
    );

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterCodigo(e.target.value);
    };

    // actualizar estado en localStorage
    const actualizarEstado = (
        registroId: string,
        nuevoEstado: 'APROBADO' | 'RECHAZADO'
    ) => {
        const nuevos = registros.map(r =>
            r.id === registroId ? { ...r, estado: nuevoEstado } : r
        );
        setRegistros(nuevos);
        localStorage.setItem('registros', JSON.stringify(nuevos));
    };

    // filtrar por pendiente y por códigoUsuario
    const registrosFiltrados = registros.filter(r => {
        const code = getCodigoEstudiante(r);
        return (
            r.estado === 'PENDIENTE' &&
            (filterCodigo === 'all' || code === filterCodigo)
        );
    });

    return (
        <div className="space-y-6 p-4">
            <h2 className="text-2xl font-bold text-[#003c71]">
                Validaciones de Registros
            </h2>

            {/* Filtrar por código de usuario */}
            <div className="flex items-center gap-4">
                <label htmlFor="codigoSelect" className="font-medium">
                    Filtrar por código:
                </label>
                <select
                    id="codigoSelect"
                    value={filterCodigo}
                    onChange={handleFilterChange}
                    className="border rounded px-3 py-1"
                >
                    <option value="all">Todos</option>
                    {codigosUnicos.map(c => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tabla de validaciones */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700 text-left">
                            <th className="px-4 py-2">Código</th>
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
                        {registrosFiltrados.map(r => (
                            <tr key={r.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2">{getCodigoEstudiante(r)}</td>
                                <td className="px-4 py-2">{r.fecha}</td>
                                <td className="px-4 py-2">{r.horaInicio}</td>
                                <td className="px-4 py-2">{r.horaFin}</td>
                                <td className="px-4 py-2">{r.actividad}</td>
                                <td className="px-4 py-2">{r.aula}</td>
                                <td className="px-4 py-2">{r.horasEfectivas}</td>
                                <td className="px-4 py-2 space-x-2">
                                    <button
                                        className="text-green-600 hover:text-green-800"
                                        onClick={() => actualizarEstado(r.id, 'APROBADO')}
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                    <button
                                        className="text-red-600 hover:text-red-800"
                                        onClick={() => actualizarEstado(r.id, 'RECHAZADO')}
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
