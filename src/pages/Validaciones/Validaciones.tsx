import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import type { Usuario, Materia } from '../../types';

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

type UsuarioConMateria = Usuario & { materiaId?: string };

const ITEMS_PER_PAGE = 15;

const ValidacionesPage: React.FC = () => {
    const { user } = useAuth();

    // Carga inicial
    const [registros, setRegistros] = useState<RegistroLocal[]>([]);
    const [usuarios] = useState<UsuarioConMateria[]>(() =>
        JSON.parse(localStorage.getItem('usuarios') || '[]')
    );
    const [materias] = useState<Materia[]>(() =>
        JSON.parse(localStorage.getItem('materias') || '[]')
    );

    // Buscador y paginación
    const [searchCodigo, setSearchCodigo] = useState<string>('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const data = localStorage.getItem('registros');
        if (data) {
            setRegistros(JSON.parse(data) as RegistroLocal[]);
        }
    }, []);

    // Helpers para extraer datos del estudiante
    const getCodigoEstudiante = (r: RegistroLocal) => {
        const u = usuarios.find(u => u.id === r.estudianteId);
        return u ? u.codigoUsuario : r.estudianteId;
    };
    const getNombreEstudiante = (r: RegistroLocal) => {
        const u = usuarios.find(u => u.id === r.estudianteId);
        return u ? `${u.nombre} ${u.apellido}` : r.estudianteId;
    };
    const getMateriaEstudiante = (r: RegistroLocal) => {
        const u = usuarios.find(u => u.id === r.estudianteId);
        if (!u || !u.materiaId) return '—';
        const m = materias.find(m => m.id === u.materiaId);
        return m ? m.nombre : '—';
    };

    // Aprobar/Rechazar
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

    // Filtrado de pendientes + búsqueda por código
    const registrosFiltrados = useMemo(() => {
        const term = searchCodigo.trim().toLowerCase();
        return registros.filter(r =>
            r.estado === 'PENDIENTE' &&
            getCodigoEstudiante(r).toLowerCase().includes(term)
        );
    }, [registros, searchCodigo]);

    // Paginación
    const pageCount = Math.max(
        1,
        Math.ceil(registrosFiltrados.length / ITEMS_PER_PAGE)
    );
    const paginated = useMemo(
        () =>
            registrosFiltrados.slice(
                (page - 1) * ITEMS_PER_PAGE,
                page * ITEMS_PER_PAGE
            ),
        [registrosFiltrados, page]
    );

    return (
        <div className="space-y-6 p-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#003c71]">
                    Validaciones de Registros
                </h2>
                <span className="text-gray-600">
                    Encargado: <strong>{user?.nombre}</strong>
                </span>
            </div>

            {/* Buscador por código */}
            <div className="flex items-center gap-4">
                <label htmlFor="searchCodigo" className="font-medium">
                    Buscar por código:
                </label>
                <input
                    id="searchCodigo"
                    type="text"
                    placeholder="Escribe el código..."
                    className="border rounded px-3 py-1"
                    value={searchCodigo}
                    onChange={e => {
                        setSearchCodigo(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            {/* Tabla de validaciones */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700 text-left">
                            <th className="px-4 py-2">Código</th>
                            <th className="px-4 py-2">Estudiante</th>
                            <th className="px-4 py-2">Materia</th>
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
                        {paginated.map(r => (
                            <tr key={r.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2">{getCodigoEstudiante(r)}</td>
                                <td className="px-4 py-2">{getNombreEstudiante(r)}</td>
                                <td className="px-4 py-2">{getMateriaEstudiante(r)}</td>
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
                        {paginated.length === 0 && (
                            <tr>
                                <td
                                    colSpan={10}
                                    className="px-4 py-2 text-center text-gray-500"
                                >
                                    No hay registros pendientes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Controles de paginación */}
            <div className="flex justify-between items-center mt-4">
                <span>
                    Página {page} de {pageCount}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                        disabled={page === pageCount}
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ValidacionesPage;
