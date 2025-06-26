import React, { useState, useEffect, useMemo } from 'react';
import useAuth from '../../hooks/useAuth';
import type { Usuario, Materia } from '../../types';
import { Search, Calendar, Filter } from 'lucide-react';

interface Filtros {
    tipoInstructor: 'TODOS' | 'SOCIAL' | 'REMUNERADA';
    fechaInicio: string;
    fechaFin: string;
    codigo: string;
}

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

const RegistroPageEncargado: React.FC = () => {
    const { user } = useAuth();
    const [registros, setRegistros] = useState<RegistroLocal[]>([]);
    const [usuarios] = useState<UsuarioConMateria[]>(() => JSON.parse(localStorage.getItem('usuarios') || '[]'));
    const [materias] = useState<Materia[]>(() => JSON.parse(localStorage.getItem('materias') || '[]'));
    const [filtros, setFiltros] = useState<Filtros>({
        tipoInstructor: 'TODOS',
        fechaInicio: '',
        fechaFin: '',
        codigo: ''
    });
    const [page, setPage] = useState(1);

    useEffect(() => {
        const data = localStorage.getItem('registros');
        if (data) setRegistros(JSON.parse(data) as RegistroLocal[]);
    }, []);

    // Helpers para datos
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
    const getTipoInstructor = (r: RegistroLocal) => {
        const u = usuarios.find(u => u.id === r.estudianteId);
        return u?.rol === 'INSTRUCTOR_SOCIAL' ? 'SOCIAL' : 'REMUNERADA';
    };

    // Filtrado
    const registrosFiltrados = useMemo(() => {
        return registros.filter(r => {
            if (filtros.codigo && !getCodigoEstudiante(r).toLowerCase().includes(filtros.codigo.toLowerCase())) return false;
            if (filtros.tipoInstructor !== 'TODOS' && getTipoInstructor(r) !== filtros.tipoInstructor) return false;
            if (filtros.fechaInicio && r.fecha < filtros.fechaInicio) return false;
            if (filtros.fechaFin && r.fecha > filtros.fechaFin) return false;
            return true;
        });
    }, [registros, filtros]);

    // Paginación
    const pageCount = Math.max(1, Math.ceil(registrosFiltrados.length / ITEMS_PER_PAGE));
    const paginated = registrosFiltrados.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <div className="space-y-6 p-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[rgb(0,60,113)]">Histórico de Registros</h2>
                <span className="text-gray-600">Usuario: <strong>{user?.nombre}</strong></span>
            </div>

            {/* Filtros con indicación de rango */}
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col md:flex-row gap-4 animate-fadeIn">
                {/* Búsqueda de código */}
                <div className="flex items-center flex-1 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[rgb(0,60,113)] transition">
                    <Search className="text-gray-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Buscar código..."
                        value={filtros.codigo}
                        onChange={e => { setFiltros(f => ({ ...f, codigo: e.target.value })); setPage(1); }}
                        className="w-full border-none focus:outline-none placeholder-gray-400"
                    />
                </div>
                {/* Tipo instructor */}
                <div className="flex items-center flex-1 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[rgb(0,60,113)] transition">
                    <Filter className="text-gray-400 mr-2" />
                    
                    <select
                        value={filtros.tipoInstructor}
                        onChange={e => { setFiltros(f => ({ ...f, tipoInstructor: e.target.value as any })); setPage(1); }}
                        className="w-full bg-transparent border-none focus:outline-none"
                    >
                        <option value="TODOS">Todos los instructores</option>
                        <option value="SOCIAL">Intructor Social</option>
                        <option value="REMUNERADA">Intructor Remunerado</option>
                    </select>
                </div>
                {/* Fecha inicio */}
                <div className="flex items-center flex-1 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[rgb(0,60,113)] transition">
                    <Calendar className="text-gray-400 mr-2" />
                    <div className="flex flex-col w-full">
                        <label className="text-xs text-gray-500">Desde</label>
                        <input
                            type="date"
                            value={filtros.fechaInicio}
                            onChange={e => { setFiltros(f => ({ ...f, fechaInicio: e.target.value })); setPage(1); }}
                            className="w-full border-none focus:outline-none"
                        />
                    </div>
                </div>
                {/* Fecha fin */}
                <div className="flex items-center flex-1 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[rgb(0,60,113)] transition">
                    <Calendar className="text-gray-400 mr-2" />
                    <div className="flex flex-col w-full">
                        <label className="text-xs text-gray-500">Hasta</label>
                        <input
                            type="date"
                            value={filtros.fechaFin}
                            onChange={e => { setFiltros(f => ({ ...f, fechaFin: e.target.value })); setPage(1); }}
                            className="w-full border-none focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Tabla de registros */}
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="min-w-full text-left animate-fadeInUp">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700">
                            <th className="px-4 py-2">Código</th>
                            <th className="px-4 py-2">Estudiante</th>
                            <th className="px-4 py-2">Materia</th>
                            <th className="px-4 py-2">Fecha</th>
                            <th className="px-4 py-2">Inicio</th>
                            <th className="px-4 py-2">Fin</th>
                            <th className="px-4 py-2">Actividad</th>
                            <th className="px-4 py-2">Aula</th>
                            <th className="px-4 py-2">Horas</th>
                            <th className="px-4 py-2">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map(r => (
                            <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2">{getCodigoEstudiante(r)}</td>
                                <td className="px-4 py-2">{getNombreEstudiante(r)}</td>
                                <td className="px-4 py-2">{getMateriaEstudiante(r)}</td>
                                <td className="px-4 py-2">{r.fecha}</td>
                                <td className="px-4 py-2">{r.horaInicio}</td>
                                <td className="px-4 py-2">{r.horaFin}</td>
                                <td className="px-4 py-2">{r.actividad}</td>
                                <td className="px-4 py-2">{r.aula}</td>
                                <td className="px-4 py-2">{r.horasEfectivas}</td>
                                <td className="px-4 py-2">
                                    <span className={
                                        r.estado === 'APROBADO' ? 'text-green-600' :
                                        r.estado === 'RECHAZADO' ? 'text-red-600' : 'text-yellow-600'
                                    }>{r.estado}</span>
                                </td>
                            </tr>
                        ))}
                        {paginated.length === 0 && (
                            <tr>
                                <td colSpan={10} className="px-4 py-2 text-center text-gray-500">No hay registros.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="flex justify-between items-center mt-4">
                <span className="text-sm">Página {page} de {pageCount}</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition"
                    >Anterior</button>
                    <button
                        onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                        disabled={page === pageCount}
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition"
                    >Siguiente</button>
                </div>
            </div>
        </div>
    );
};

export default RegistroPageEncargado;


