import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import useAuth from '../../hooks/useAuth';
import { Search, Calendar, Filter } from 'lucide-react';
const ITEMS_PER_PAGE = 15;
const RegistroPageEncargado = () => {
    const { user } = useAuth();
    const [registros, setRegistros] = useState([]);
    const [usuarios] = useState(() => JSON.parse(localStorage.getItem('usuarios') || '[]'));
    const [materias] = useState(() => JSON.parse(localStorage.getItem('materias') || '[]'));
    const [filtros, setFiltros] = useState({
        tipoInstructor: 'TODOS',
        fechaInicio: '',
        fechaFin: '',
        codigo: ''
    });
    const [page, setPage] = useState(1);
    useEffect(() => {
        const data = localStorage.getItem('registros');
        if (data)
            setRegistros(JSON.parse(data));
    }, []);
    // Helpers para datos
    const getCodigoEstudiante = (r) => {
        const u = usuarios.find(u => u.idUsuario === r.estudianteId);
        return u ? u.codigoUsuario : r.estudianteId;
    };
    const getNombreEstudiante = (r) => {
        const u = usuarios.find(u => u.idUsuario === r.estudianteId);
        return u ? `${u.nombre} ${u.apellido}` : r.estudianteId;
    };
    const getMateriaEstudiante = (r) => {
        const u = usuarios.find(u => u.idUsuario === r.estudianteId);
        if (!u || !u.materiaId)
            return '—';
        const m = materias.find(m => m.idMateria === u.materiaId);
        return m ? m.nombreMateria : '—';
    };
    const getTipoInstructor = (r) => {
        const u = usuarios.find(u => u.idUsuario === r.estudianteId);
        return u?.rol === 'INSTRUCTOR_NORMAL' ? 'SOCIAL' : 'REMUNERADA';
    };
    // Filtrado
    const registrosFiltrados = useMemo(() => {
        return registros.filter(r => {
            if (filtros.codigo && !getCodigoEstudiante(r).toLowerCase().includes(filtros.codigo.toLowerCase()))
                return false;
            if (filtros.tipoInstructor !== 'TODOS' && getTipoInstructor(r) !== filtros.tipoInstructor)
                return false;
            if (filtros.fechaInicio && r.fecha < filtros.fechaInicio)
                return false;
            if (filtros.fechaFin && r.fecha > filtros.fechaFin)
                return false;
            return true;
        });
    }, [registros, filtros]);
    // Paginación
    const pageCount = Math.max(1, Math.ceil(registrosFiltrados.length / ITEMS_PER_PAGE));
    const paginated = registrosFiltrados.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    return (_jsxs("div", { className: "space-y-6 p-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-[rgb(0,60,113)]", children: "Hist\u00F3rico de Registros" }), _jsxs("span", { className: "text-gray-600", children: ["Usuario: ", _jsx("strong", { children: user?.nombre })] })] }), _jsxs("div", { className: "bg-white p-4 rounded-lg shadow-md flex flex-col md:flex-row gap-4 animate-fadeIn", children: [_jsxs("div", { className: "flex items-center flex-1 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[rgb(0,60,113)] transition", children: [_jsx(Search, { className: "text-gray-400 mr-2" }), _jsx("input", { type: "text", placeholder: "Buscar c\u00F3digo...", value: filtros.codigo, onChange: e => { setFiltros(f => ({ ...f, codigo: e.target.value })); setPage(1); }, className: "w-full border-none focus:outline-none placeholder-gray-400" })] }), _jsxs("div", { className: "flex items-center flex-1 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[rgb(0,60,113)] transition", children: [_jsx(Filter, { className: "text-gray-400 mr-2" }), _jsxs("select", { value: filtros.tipoInstructor, onChange: e => { setFiltros(f => ({ ...f, tipoInstructor: e.target.value })); setPage(1); }, className: "w-full bg-transparent border-none focus:outline-none", children: [_jsx("option", { value: "TODOS", children: "Todos los instructores" }), _jsx("option", { value: "SOCIAL", children: "Intructor Social" }), _jsx("option", { value: "REMUNERADA", children: "Intructor Remunerado" })] })] }), _jsxs("div", { className: "flex items-center flex-1 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[rgb(0,60,113)] transition", children: [_jsx(Calendar, { className: "text-gray-400 mr-2" }), _jsxs("div", { className: "flex flex-col w-full", children: [_jsx("label", { className: "text-xs text-gray-500", children: "Desde" }), _jsx("input", { type: "date", value: filtros.fechaInicio, onChange: e => { setFiltros(f => ({ ...f, fechaInicio: e.target.value })); setPage(1); }, className: "w-full border-none focus:outline-none" })] })] }), _jsxs("div", { className: "flex items-center flex-1 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[rgb(0,60,113)] transition", children: [_jsx(Calendar, { className: "text-gray-400 mr-2" }), _jsxs("div", { className: "flex flex-col w-full", children: [_jsx("label", { className: "text-xs text-gray-500", children: "Hasta" }), _jsx("input", { type: "date", value: filtros.fechaFin, onChange: e => { setFiltros(f => ({ ...f, fechaFin: e.target.value })); setPage(1); }, className: "w-full border-none focus:outline-none" })] })] })] }), _jsx("div", { className: "overflow-x-auto bg-white rounded-lg shadow-md", children: _jsxs("table", { className: "min-w-full text-left animate-fadeInUp", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-100 text-gray-700", children: [_jsx("th", { className: "px-4 py-2", children: "C\u00F3digo" }), _jsx("th", { className: "px-4 py-2", children: "Estudiante" }), _jsx("th", { className: "px-4 py-2", children: "Materia" }), _jsx("th", { className: "px-4 py-2", children: "Fecha" }), _jsx("th", { className: "px-4 py-2", children: "Inicio" }), _jsx("th", { className: "px-4 py-2", children: "Fin" }), _jsx("th", { className: "px-4 py-2", children: "Actividad" }), _jsx("th", { className: "px-4 py-2", children: "Aula" }), _jsx("th", { className: "px-4 py-2", children: "Horas" }), _jsx("th", { className: "px-4 py-2", children: "Estado" })] }) }), _jsxs("tbody", { children: [paginated.map(r => (_jsxs("tr", { className: "border-b hover:bg-gray-50 transition-colors", children: [_jsx("td", { className: "px-4 py-2", children: getCodigoEstudiante(r) }), _jsx("td", { className: "px-4 py-2", children: getNombreEstudiante(r) }), _jsx("td", { className: "px-4 py-2", children: getMateriaEstudiante(r) }), _jsx("td", { className: "px-4 py-2", children: r.fecha }), _jsx("td", { className: "px-4 py-2", children: r.horaInicio }), _jsx("td", { className: "px-4 py-2", children: r.horaFin }), _jsx("td", { className: "px-4 py-2", children: r.actividad }), _jsx("td", { className: "px-4 py-2", children: r.aula }), _jsx("td", { className: "px-4 py-2", children: r.horasEfectivas }), _jsx("td", { className: "px-4 py-2", children: _jsx("span", { className: r.estado === 'APROBADO' ? 'text-green-600' :
                                                    r.estado === 'RECHAZADO' ? 'text-red-600' : 'text-yellow-600', children: r.estado }) })] }, r.id))), paginated.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 10, className: "px-4 py-2 text-center text-gray-500", children: "No hay registros." }) }))] })] }) }), _jsxs("div", { className: "flex justify-between items-center mt-4", children: [_jsxs("span", { className: "text-sm", children: ["P\u00E1gina ", page, " de ", pageCount] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1, className: "px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition", children: "Anterior" }), _jsx("button", { onClick: () => setPage(p => Math.min(pageCount, p + 1)), disabled: page === pageCount, className: "px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition", children: "Siguiente" })] })] })] }));
};
export default RegistroPageEncargado;
