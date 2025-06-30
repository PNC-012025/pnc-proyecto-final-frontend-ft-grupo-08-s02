import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { listarRegistrosPorUsuarioYFechas } from '../../services/registroHoraService';
import { listarMateriasPorUsuario } from '../../services/usuarioMateriaService';
import { listarMaterias } from '../../services/materiaService';
import { listarActividades } from '../../services/actividadService';
const RegistrosPage = () => {
    const { user } = useAuth();
    const userId = user?.idUsuario ?? '';
    const userCode = user?.codigoUsuario ?? '';
    const canFilter = /(?:INSTRUCTOR_NORMAL|INSTRUCTOR_REMUNERADO)/i.test(user?.rol ?? '');
    /* materias y materia seleccionada */
    const [materias, setMaterias] = useState([]);
    const [materiaSel, setMateriaSel] = useState('');
    /* registros históricos filtrados */
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actividades, setActividades] = useState([]);
    const printableRef = useRef(null);
    // Datos fijos y rellenables
    const [info, setInfo] = useState({
        nombre: user?.nombre || '',
        carrera: 'Ingenieria Informatica',
        carnet: userCode,
        telefono: '',
        proyecto: '',
        institucion: '',
        inicio: '',
    });
    // Cargar materias asignadas al usuario
    const loadMaterias = useCallback(async () => {
        if (!canFilter)
            return;
        try {
            // Obtener todas las materias
            const todasLasMateriasRes = await listarMaterias();
            const todasLasMaterias = todasLasMateriasRes.data;
            // Obtener las materias asignadas al usuario
            const materiasUsuarioRes = await listarMateriasPorUsuario(String(userId));
            const materiasUsuario = materiasUsuarioRes.data;
            // Filtrar las materias que están asignadas al usuario
            const materiasAsignadas = todasLasMaterias.filter(materia => materiasUsuario.some((m) => m.nombreMateria === materia.nombreMateria));
            setMaterias(materiasAsignadas);
            if (materiasAsignadas.length > 0) {
                setMateriaSel(materiasAsignadas[0].idMateria);
            }
        }
        catch (error) {
            console.error('Error cargando materias:', error);
        }
    }, [canFilter, userId]);
    // Cargar registros históricos
    const loadRegistrosHistoricos = useCallback(async () => {
        setLoading(true);
        try {
            const [registrosRes, actividadesRes] = await Promise.all([
                listarRegistrosPorUsuarioYFechas(userId, '1900-01-01', '2099-12-31'),
                listarActividades()
            ]);
            const getValue = (val) => Array.isArray(val) ? val[0] : val;
            const registrosProcesados = registrosRes.data.map((registro) => {
                return {
                    ...registro,
                    idRegistro: getValue(registro.id_registro_hora) ?? getValue(registro.idRegistro),
                    codigoUsuario: getValue(registro.codigo_usuario) ?? getValue(registro.codigoUsuario),
                    fechaRegistro: getValue(registro.fecha_registro) ?? getValue(registro.fechaRegistro),
                    horaInicio: getValue(registro.hora_inicio) ?? getValue(registro.horaInicio),
                    horaFin: getValue(registro.hora_fin) ?? getValue(registro.horaFin),
                    idActividad: getValue(registro.id_actividad) ?? getValue(registro.idActividad),
                    idFormulario: getValue(registro.id_formulario) ?? getValue(registro.idFormulario),
                    horasEfectivas: getValue(registro.horas_efectivas) ?? getValue(registro.horasEfectivas),
                    estado: getValue(registro.estado) ?? 'PENDIENTE'
                };
            });
            // Filtrar solo registros históricos (APROBADO/RECHAZADO)
            const registrosHistoricos = registrosProcesados.filter(registro => registro.estado === 'APROBADO' || registro.estado === 'RECHAZADO');
            setRegistros(registrosHistoricos);
            setActividades(actividadesRes.data);
        }
        catch (error) {
            console.error('Error cargando registros históricos:', error);
            // Fallback a localStorage si la API falla
            const local = localStorage.getItem('registros');
            if (local) {
                const registrosLocal = JSON.parse(local);
                const registrosHistoricos = registrosLocal.filter((r) => (r.estado === 'APROBADO' || r.estado === 'RECHAZADO') &&
                    r.codigoUsuario === userCode);
                setRegistros(registrosHistoricos);
            }
        }
        finally {
            setLoading(false);
        }
    }, [userId, userCode]);
    useEffect(() => {
        loadMaterias();
        loadRegistrosHistoricos();
    }, [loadMaterias, loadRegistrosHistoricos]);
    // Filtrar registros por materia seleccionada
    const registrosFiltrados = registros.filter(r => !materiaSel || r.idFormulario === materiaSel);
    // Función helper para obtener el nombre de la actividad
    const getNombreActividad = (idActividad) => {
        const id = typeof idActividad === 'string' ? idActividad : String(idActividad);
        const actividad = actividades.find(a => a.idActividad === id);
        return actividad ? actividad.nombreActividad : idActividad ? String(idActividad) : '—';
    };
    // Formatear fecha
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    };
    // Formatear hora
    const formatTime = (timeString) => {
        if (!timeString || typeof timeString !== 'string')
            return '--:--';
        return timeString.substring(0, 5); // Mostrar solo HH:MM
    };
    // Obtener color del estado
    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'APROBADO':
                return 'bg-green-100 text-green-800';
            case 'RECHAZADO':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    /* ── Generar PDF con márgenes y alta resolución ── */
    const downloadPdf = async () => {
        if (!printableRef.current)
            return;
        const canvas = await html2canvas(printableRef.current, { scale: 2 });
        const pdf = new jsPDF('l', 'pt', 'a4');
        const margin = 20;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const usableWidth = pageWidth - margin * 2;
        const height = (canvas.height * usableWidth) / canvas.width;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, usableWidth, height);
        pdf.save(`Registro_Asistencia_${info.carnet}_${Date.now()}.pdf`);
    };
    if (loading) {
        return (_jsxs("div", { className: "space-y-8 p-6 max-w-5xl mx-auto", children: [_jsx("header", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: _jsx("h1", { className: "text-3xl font-bold text-[#003c71]", children: "Mis Registros Hist\u00F3ricos" }) }), _jsxs("div", { className: "flex items-center justify-center p-8", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }), _jsx("span", { className: "ml-2 text-gray-600", children: "Cargando registros hist\u00F3ricos..." })] })] }));
    }
    return (_jsxs("div", { className: "space-y-8 p-6 max-w-5xl mx-auto", children: [_jsxs("header", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: [_jsx("h1", { className: "text-3xl font-bold text-[#003c71]", children: "Mis Registros Hist\u00F3ricos" }), _jsxs("div", { className: "flex items-center gap-3", children: [canFilter && materias.length > 0 && (_jsxs("select", { value: materiaSel, onChange: e => setMateriaSel(e.target.value), className: "border border-gray-300 rounded px-3 py-2 bg-white", children: [_jsx("option", { value: "", children: "Todas las Materias" }), materias.map(m => (_jsx("option", { value: m.idMateria, children: m.nombreMateria }, m.idMateria)))] })), _jsx("button", { onClick: downloadPdf, className: "bg-[#003c71] hover:bg-[#002f59] text-white px-4 py-2 rounded flex items-center shadow", children: "Descargar PDF" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-white p-4 rounded-lg shadow", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500", children: "Total de Registros" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: registrosFiltrados.length })] }), _jsxs("div", { className: "bg-white p-4 rounded-lg shadow", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500", children: "Aprobados" }), _jsx("p", { className: "text-2xl font-bold text-green-600", children: registrosFiltrados.filter(r => r.estado === 'APROBADO').length })] }), _jsxs("div", { className: "bg-white p-4 rounded-lg shadow", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500", children: "Rechazados" }), _jsx("p", { className: "text-2xl font-bold text-red-600", children: registrosFiltrados.filter(r => r.estado === 'RECHAZADO').length })] })] }), canFilter && (_jsxs("section", { className: "bg-white p-5 rounded-xl shadow space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold text-[#003c71]", children: "Informaci\u00F3n para Control de Asistencia" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                            ['Carrera', info.carrera, true],
                            ['Carnet', info.carnet, true],
                            ['Teléfono', info.telefono, false],
                            ['Proyecto', info.proyecto, false],
                            ['Responsable', info.institucion, false],
                            ['Fecha inicio', info.inicio, false, 'date'],
                        ].map(([label, val, ro, type], i) => (_jsxs("div", { className: "flex flex-col", children: [_jsx("label", { className: "text-sm font-medium", children: label }), _jsx("input", { type: type || 'text', value: val, readOnly: ro, onChange: e => {
                                        const v = e.target.value;
                                        const key = (['carrera', 'carnet', 'telefono', 'proyecto', 'institucion', 'inicio'][i]);
                                        setInfo(info => ({ ...info, [key]: v }));
                                    }, className: `w-full border rounded px-3 py-2 ${ro ? 'bg-gray-100 cursor-not-allowed' : ''}` })] }, i))) })] })), _jsxs("div", { ref: printableRef, className: "bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden", children: [_jsxs("div", { className: "bg-gray-100 px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Nombre:" }), " ", info.nombre] }), _jsxs("p", { children: [_jsx("strong", { children: "Carrera:" }), " ", info.carrera] }), _jsxs("p", { children: [_jsx("strong", { children: "Carnet:" }), " ", info.carnet] }), _jsxs("p", { children: [_jsx("strong", { children: "Tel\u00E9fono:" }), " ", info.telefono || '-'] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Proyecto:" }), " ", info.proyecto || '-'] }), _jsxs("p", { children: [_jsx("strong", { children: "Responsable:" }), " ", info.institucion || '-'] }), _jsxs("p", { children: [_jsx("strong", { children: "Fecha inicio:" }), " ", info.inicio || '-'] }), _jsxs("p", { children: [_jsx("strong", { children: "Materia:" }), " ", materias.find(m => m.idMateria === materiaSel)?.nombreMateria || '—'] })] })] }), _jsx("div", { className: "p-6 overflow-x-auto", children: _jsxs("table", { className: "min-w-full border-collapse border border-gray-300", children: [_jsx("thead", { children: _jsx("tr", { className: "bg-white", children: [
                                            'Fecha',
                                            'Hora inicio',
                                            'Hora fin',
                                            'Actividad',
                                            'Aula',
                                            'Horas efectivas',
                                            'Estado',
                                            'Firma Encargado'
                                        ].map(col => (_jsx("th", { className: "border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700", children: col }, col))) }) }), _jsx("tbody", { children: registrosFiltrados.length ? registrosFiltrados.map(r => (_jsxs("tr", { className: "bg-white hover:bg-gray-50", children: [_jsx("td", { className: "border border-gray-300 px-4 py-2 text-sm", children: formatDate(r.fechaRegistro) }), _jsx("td", { className: "border border-gray-300 px-4 py-2 text-sm", children: formatTime(r.horaInicio) }), _jsx("td", { className: "border border-gray-300 px-4 py-2 text-sm", children: formatTime(r.horaFin) }), _jsx("td", { className: "border border-gray-300 px-4 py-2 text-sm", children: getNombreActividad(r.idActividad) }), _jsx("td", { className: "border border-gray-300 px-4 py-2 text-sm", children: r.aula }), _jsxs("td", { className: "border border-gray-300 px-4 py-2 text-sm", children: [r.horasEfectivas, "h"] }), _jsx("td", { className: "border border-gray-300 px-4 py-2 text-sm", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(r.estado || 'PENDIENTE')}`, children: r.estado || 'PENDIENTE' }) }), _jsx("td", { className: "border border-gray-300 px-4 py-2 text-sm", children: "________________" })] }, r.idRegistro))) : (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "border border-gray-300 px-4 py-6 text-center text-gray-500", children: "No hay registros hist\u00F3ricos." }) })) })] }) })] })] }));
};
export default RegistrosPage;
