import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { listarRegistros } from '../../services/registroHoraService';
import { listarUsuarios } from '../../services/userService';
import { listarMaterias } from '../../services/materiaService';
import { listarActividades } from '../../services/actividadService';
import { crearValidacion, rechazarFormulario } from '../../services/validacionService';
const ITEMS_PER_PAGE = 15;
const ValidacionesPage = () => {
    const { user } = useAuth();
    // Verificar si el usuario tiene permisos para validar
    // Solo el usuario con ID 1001 (Admin UCA) puede validar
    const canValidate = user?.idUsuario === '1001' || user?.rol === 'ENCARGADO';
    const [registros, setRegistros] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [actividades, setActividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchCodigo, setSearchCodigo] = useState('');
    const [page, setPage] = useState(1);
    const [processing, setProcessing] = useState(null);
    // Cargar datos iniciales
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [registrosRes, usuariosRes, materiasRes, actividadesRes] = await Promise.all([
                    listarRegistros(),
                    listarUsuarios(),
                    listarMaterias(),
                    listarActividades()
                ]);
                // Procesar registros para normalizar datos
                const registrosProcesados = registrosRes.data.map((registro) => {
                    const getValue = (val) => Array.isArray(val) ? val[0] : val;
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
                setRegistros(registrosProcesados);
                setUsuarios(usuariosRes.data);
                setMaterias(materiasRes.data);
                setActividades(actividadesRes.data);
            }
            catch (error) {
                console.error('Error cargando datos:', error);
            }
            finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);
    const getCodigoEstudiante = (registro) => {
        return registro.codigoUsuario || '—';
    };
    const getNombreEstudiante = (registro) => {
        const usuario = usuarios.find(u => u.codigoUsuario === registro.codigoUsuario);
        return usuario ? `${usuario.nombre} ${usuario.apellido}` : registro.codigoUsuario || '—';
    };
    const getNombreMateria = (registro) => {
        // Buscar la materia a través del formulario o directamente
        if (registro.idFormulario) {
            // Aquí podrías buscar la materia asociada al formulario
            return `Formulario ${registro.idFormulario}`;
        }
        return '—';
    };
    const getNombreActividad = (registro) => {
        const actividad = actividades.find(a => a.idActividad === registro.idActividad);
        return actividad ? actividad.nombreActividad : registro.idActividad || '—';
    };
    const actualizarEstado = async (registroId, nuevoEstado) => {
        // Verificar permisos
        if (!canValidate) {
            alert('❌ No tienes permisos para validar registros. Solo el usuario Admin UCA puede realizar esta acción.');
            return;
        }
        setProcessing(registroId);
        try {
            const registro = registros.find(r => r.idRegistro === registroId);
            if (!registro) {
                alert('Registro no encontrado');
                return;
            }
            // Debug: Mostrar información del usuario y registro
            console.log('🔍 Debug - Usuario actual:', {
                idUsuario: user?.idUsuario,
                nombre: user?.nombre,
                rol: user?.rol,
                codigoUsuario: user?.codigoUsuario
            });
            console.log('🔍 Debug - Registro a validar:', {
                idRegistro: registro.idRegistro,
                idFormulario: registro.idFormulario,
                codigoUsuario: registro.codigoUsuario
            });
            let response;
            if (nuevoEstado === 'APROBADO') {
                // Usar endpoint de crear validación para aprobar
                const validacionDTO = {
                    idFormulario: registro.idFormulario,
                    idEncargado: user?.idUsuario || '',
                    estado: 'APROBADO',
                    observacion: undefined
                };
                console.log('🔍 Debug - DTO de validación (APROBADO):', validacionDTO);
                response = await crearValidacion(validacionDTO);
            }
            else {
                // Usar endpoint específico para rechazar
                console.log('🔍 Debug - Rechazando formulario:', registro.idFormulario);
                response = await rechazarFormulario(registro.idFormulario, 'Registro rechazado por el encargado');
            }
            console.log('✅ Respuesta del servidor:', response);
            // Actualizar estado local
            setRegistros(prev => prev.map(r => r.idRegistro === registroId
                ? { ...r, estado: nuevoEstado }
                : r));
            alert(`✅ Registro ${nuevoEstado.toLowerCase()} exitosamente`);
        }
        catch (error) {
            console.error('❌ Error actualizando estado:', error);
            console.error('❌ Detalles del error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
            let errorMessage = '❌ Error al actualizar el estado del registro';
            if (error.response?.status === 401) {
                errorMessage = '❌ Error de autenticación. Verifica que tengas permisos de encargado.';
            }
            else if (error.response?.status === 403) {
                errorMessage = '❌ Acceso denegado. No tienes permisos para esta acción.';
            }
            else if (error.response?.status === 404) {
                errorMessage = '❌ Recurso no encontrado. El formulario o registro no existe.';
            }
            else if (error.response?.status >= 500) {
                errorMessage = '❌ Error del servidor. Contacta al administrador.';
            }
            alert(errorMessage);
        }
        finally {
            setProcessing(null);
        }
    };
    const registrosFiltrados = useMemo(() => {
        const term = searchCodigo.trim().toLowerCase();
        return registros.filter(r => r.estado === 'PENDIENTE' &&
            getCodigoEstudiante(r).toLowerCase().includes(term));
    }, [registros, searchCodigo]);
    const pageCount = Math.max(1, Math.ceil(registrosFiltrados.length / ITEMS_PER_PAGE));
    const paginated = useMemo(() => registrosFiltrados.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE), [registrosFiltrados, page]);
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    };
    const formatTime = (timeString) => {
        if (!timeString || typeof timeString !== 'string')
            return '--:--';
        return timeString.substring(0, 5); // Mostrar solo HH:MM
    };
    if (loading) {
        return (_jsxs("div", { className: "space-y-6 p-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-[#003c71]", children: "Validaciones de Registros" }), _jsxs("span", { className: "text-gray-600", children: ["Usuario: ", _jsx("strong", { children: user?.nombre })] })] }), _jsxs("div", { className: "flex items-center justify-center p-8", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }), _jsx("span", { className: "ml-2 text-gray-600", children: "Cargando registros..." })] })] }));
    }
    // Verificar permisos de acceso
    if (!canValidate) {
        return (_jsxs("div", { className: "space-y-6 p-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-[#003c71]", children: "Validaciones de Registros" }), _jsxs("span", { className: "text-gray-600", children: ["Usuario: ", _jsx("strong", { children: user?.nombre })] })] }), _jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-6 text-center", children: [_jsx("div", { className: "text-red-600 text-lg font-semibold mb-2", children: "\u274C Acceso Denegado" }), _jsxs("p", { className: "text-red-700", children: ["Solo el usuario ", _jsx("strong", { children: "Admin UCA" }), " puede acceder a esta p\u00E1gina."] }), _jsxs("p", { className: "text-red-600 mt-2", children: ["Tu ID: ", _jsx("strong", { children: user?.idUsuario || 'No definido' })] }), _jsxs("p", { className: "text-red-600", children: ["Tu rol: ", _jsx("strong", { children: user?.rol || 'No definido' })] }), _jsx("p", { className: "text-gray-600 mt-4 text-sm", children: "Para acceder, debes estar logueado como el usuario Admin UCA (ID: 1001)" })] })] }));
    }
    return (_jsxs("div", { className: "space-y-6 p-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-[#003c71]", children: "Validaciones de Registros" }), _jsxs("span", { className: "text-gray-600", children: ["Usuario: ", _jsx("strong", { children: user?.nombre })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("label", { htmlFor: "searchCodigo", className: "font-medium", children: "Buscar por c\u00F3digo:" }), _jsx("input", { id: "searchCodigo", type: "text", placeholder: "Escribe el c\u00F3digo...", className: "border rounded px-3 py-1", value: searchCodigo, onChange: e => { setSearchCodigo(e.target.value); setPage(1); } }), _jsxs("span", { className: "text-sm text-gray-500", children: [registrosFiltrados.length, " registros pendientes"] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full bg-white rounded shadow divide-y divide-gray-200", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-100 text-gray-700 text-left", children: [_jsx("th", { className: "px-4 py-2", children: "C\u00F3digo" }), _jsx("th", { className: "px-4 py-2", children: "Estudiante" }), _jsx("th", { className: "px-4 py-2", children: "Materia" }), _jsx("th", { className: "px-4 py-2", children: "Fecha" }), _jsx("th", { className: "px-4 py-2", children: "Hora Inicio" }), _jsx("th", { className: "px-4 py-2", children: "Hora Fin" }), _jsx("th", { className: "px-4 py-2", children: "Actividad" }), _jsx("th", { className: "px-4 py-2", children: "Aula" }), _jsx("th", { className: "px-4 py-2", children: "Horas" }), _jsx("th", { className: "px-4 py-2", children: "Acciones" })] }) }), _jsxs("tbody", { className: "divide-y divide-gray-100", children: [paginated.map(r => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-2", children: getCodigoEstudiante(r) }), _jsx("td", { className: "px-4 py-2", children: getNombreEstudiante(r) }), _jsx("td", { className: "px-4 py-2", children: getNombreMateria(r) }), _jsx("td", { className: "px-4 py-2", children: formatDate(r.fechaRegistro) }), _jsx("td", { className: "px-4 py-2", children: formatTime(r.horaInicio) }), _jsx("td", { className: "px-4 py-2", children: formatTime(r.horaFin) }), _jsx("td", { className: "px-4 py-2", children: getNombreActividad(r) }), _jsx("td", { className: "px-4 py-2", children: r.aula }), _jsxs("td", { className: "px-4 py-2", children: [r.horasEfectivas, "h"] }), _jsxs("td", { className: "px-4 py-2 space-x-2", children: [_jsx("button", { className: "text-green-600 hover:text-green-800 disabled:opacity-50", onClick: () => actualizarEstado(r.idRegistro, 'APROBADO'), disabled: processing === r.idRegistro, title: "Aprobar", children: processing === r.idRegistro ? (_jsx(RefreshCw, { size: 18, className: "animate-spin" })) : (_jsx(CheckCircle, { size: 18 })) }), _jsx("button", { className: "text-red-600 hover:text-red-800 disabled:opacity-50", onClick: () => actualizarEstado(r.idRegistro, 'RECHAZADO'), disabled: processing === r.idRegistro, title: "Rechazar", children: processing === r.idRegistro ? (_jsx(RefreshCw, { size: 18, className: "animate-spin" })) : (_jsx(XCircle, { size: 18 })) })] })] }, r.idRegistro))), paginated.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 10, className: "px-4 py-2 text-center text-gray-500", children: "No hay registros pendientes." }) }))] })] }) }), _jsxs("div", { className: "flex justify-between items-center mt-4", children: [_jsxs("span", { children: ["P\u00E1gina ", page, " de ", pageCount] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1, className: "px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50", children: "Anterior" }), _jsx("button", { onClick: () => setPage(p => Math.min(pageCount, p + 1)), disabled: page === pageCount, className: "px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50", children: "Siguiente" })] })] })] }));
};
export default ValidacionesPage;
