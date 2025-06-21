import React, { useState, useEffect } from 'react';
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

const RegistroPageEncargado: React.FC = () => {
    const { user } = useAuth();

    // Cargar registros e usuarios desde localStorage
    const [registros, setRegistros] = useState<RegistroLocal[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>(() =>
        JSON.parse(localStorage.getItem('usuarios') || '[]')
    );
    const [filterCodigo, setFilterCodigo] = useState<string>('all');

    useEffect(() => {
        const data = localStorage.getItem('registros');
        if (data) {
            setRegistros(JSON.parse(data) as RegistroLocal[]);
        }
    }, []);

    // Devuelve el codigoUsuario o el id si no se encuentra
    const getCodigoEstudiante = (r: RegistroLocal) => {
        const u = usuarios.find(u => u.id === r.estudianteId);
        return u ? u.codigoUsuario : r.estudianteId;
    };

    // Devuelve el nombre completo o el id
    const getNombreEstudiante = (r: RegistroLocal) => {
        const u = usuarios.find(u => u.id === r.estudianteId);
        return u ? `${u.nombre} ${u.apellido}` : r.estudianteId;
    };

    // Opciones unicas para el filtro
    const codigosUnicos = Array.from(
        new Set(registros.map(getCodigoEstudiante))
    );

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterCodigo(e.target.value);
    };

    // Filtrar por codigo (o "all" para ver todos)
    const registrosFiltrados = registros.filter(r => {
        const code = getCodigoEstudiante(r);
        return filterCodigo === 'all' || code === filterCodigo;
    });

    return (
        <div className="space-y-6 p-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#003c71]">
                    Histórico de Registros
                </h2>
                <span className="text-gray-600">
                    Usuario: <strong>{user?.nombre}</strong>
                </span>
            </div>

            {/* Filtro por código de usuario */}
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

            {/* Tabla de histórico */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700 text-left">
                            <th className="px-4 py-2">Código</th>
                            <th className="px-4 py-2">Estudiante</th>
                            <th className="px-4 py-2">Fecha</th>
                            <th className="px-4 py-2">Hora Inicio</th>
                            <th className="px-4 py-2">Hora Fin</th>
                            <th className="px-4 py-2">Actividad</th>
                            <th className="px-4 py-2">Aula</th>
                            <th className="px-4 py-2">Horas</th>
                            <th className="px-4 py-2">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrosFiltrados.map(r => (
                            <tr key={r.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2">{getCodigoEstudiante(r)}</td>
                                <td className="px-4 py-2">{getNombreEstudiante(r)}</td>
                                <td className="px-4 py-2">{r.fecha}</td>
                                <td className="px-4 py-2">{r.horaInicio}</td>
                                <td className="px-4 py-2">{r.horaFin}</td>
                                <td className="px-4 py-2">{r.actividad}</td>
                                <td className="px-4 py-2">{r.aula}</td>
                                <td className="px-4 py-2">{r.horasEfectivas}</td>
                                <td className="px-4 py-2">
                                    <span
                                        className={
                                            r.estado === 'APROBADO'
                                                ? 'text-green-600'
                                                : r.estado === 'RECHAZADO'
                                                    ? 'text-red-600'
                                                    : 'text-yellow-600'
                                        }
                                    >
                                        {r.estado}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {registrosFiltrados.length === 0 && (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="px-4 py-2 text-center text-gray-500"
                                >
                                    No hay registros.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RegistroPageEncargado;
