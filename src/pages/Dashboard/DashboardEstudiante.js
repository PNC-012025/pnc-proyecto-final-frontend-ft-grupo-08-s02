import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { calcularHorasEfectivas } from '../../utils/timeUtils';
import { listarMateriasPorUsuario } from '../../services/usuarioMateriaService';
import { listarMaterias } from '../../services/materiaService';
import { listarActividades } from '../../services/actividadService';
import { listarFormulariosPorUsuario, crearFormulario } from '../../services/formularioService';
import { listarRegistrosPorUsuarioYFechas, crearRegistroHora, actualizarRegistroHora, eliminarRegistro, } from '../../services/registroHoraService';
const DashboardEstudiante = () => {
    const { user } = useAuth();
    const userId = user?.idUsuario ?? '';
    const userCode = user?.codigoUsuario ?? '';
    // State
    const [materias, setMaterias] = useState([]);
    const [actividades, setActividades] = useState([]);
    const [formularios, setFormularios] = useState([]);
    const [registros, setRegistros] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [loadingMaterias, setLoadingMaterias] = useState(true);
    const [errorMaterias, setErrorMaterias] = useState(null);
    const [loadingRegistros, setLoadingRegistros] = useState(true);
    const [form, setForm] = useState({
        fechaRegistro: '',
        horaInicio: '',
        horaFin: '',
        aula: '',
        idActividad: 0,
        idFormulario: 0,
    });
    // Load materias
    const loadMaterias = useCallback(async () => {
        setLoadingMaterias(true);
        setErrorMaterias(null);
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
        }
        catch (error) {
            console.error('Error cargando materias:', error);
            setErrorMaterias('Error al cargar las materias asignadas');
        }
        finally {
            setLoadingMaterias(false);
        }
    }, [userId]);
    // Load actividades
    const loadActividades = useCallback(async () => {
        try {
            const actividadesRes = await listarActividades();
            const todasLasActividades = actividadesRes.data;
            // Filtrar actividades según el rol del usuario
            const actividadesFiltradas = todasLasActividades.filter(actividad => {
                if (user?.rol === 'INSTRUCTOR_NORMAL') {
                    return ['APOYO_PRACTICAS_LABORATORIO', 'CONSULTAS', 'APOYO_CLASE', 'APOYO_EN_PARCIAL'].includes(actividad.nombreActividad);
                }
                else if (user?.rol === 'INSTRUCTOR_REMUNERADO') {
                    return ['PRACTICA_LABORATORIO', 'PERMANENCIA', 'APOYO_PARCIAL', 'APOYO_INFORMATICO'].includes(actividad.nombreActividad);
                }
                return false;
            });
            setActividades(actividadesFiltradas);
            console.log('Actividades cargadas:', actividadesFiltradas);
        }
        catch (error) {
            console.error('Error cargando actividades:', error);
        }
    }, [user?.rol]);
    useEffect(() => {
        loadMaterias();
        loadActividades();
    }, [loadMaterias, loadActividades]);
    // Load registros y formularios
    const loadRegistrosYFormularios = useCallback(async () => {
        setLoadingRegistros(true);
        try {
            const [registrosRes, formulariosRes] = await Promise.all([
                listarRegistrosPorUsuarioYFechas(userId, '1900-01-01', '2099-12-31'),
                listarFormulariosPorUsuario(String(userId)),
            ]);
            const pad = (n) => n.toString().padStart(2, '0');
            const getValue = (val) => Array.isArray(val) ? val[0] : val;
            const registrosConEstado = registrosRes.data.map((registro) => {
                const formulario = formulariosRes.data.find(f => String(f.idFormulario) === String(getValue(registro.id_formulario) ?? getValue(registro.idFormulario)));
                // Formatear fecha y hora si vienen como número
                let fechaRegistro = getValue(registro.fecha_registro) ?? getValue(registro.fechaRegistro);
                if (typeof fechaRegistro === 'number')
                    fechaRegistro = `${fechaRegistro}-01-01`;
                let horaInicio = getValue(registro.hora_inicio) ?? getValue(registro.horaInicio);
                if (typeof horaInicio === 'number')
                    horaInicio = `${pad(horaInicio)}:00:00`;
                let horaFin = getValue(registro.hora_fin) ?? getValue(registro.horaFin);
                if (typeof horaFin === 'number')
                    horaFin = `${pad(horaFin)}:00:00`;
                return {
                    ...registro,
                    idRegistro: getValue(registro.id_registro_hora) ?? getValue(registro.idRegistro),
                    horaInicio,
                    horaFin,
                    idActividad: getValue(registro.id_actividad) ?? getValue(registro.idActividad),
                    idFormulario: getValue(registro.id_formulario) ?? getValue(registro.idFormulario),
                    horasEfectivas: getValue(registro.horas_efectivas) ?? getValue(registro.horasEfectivas),
                    fechaRegistro,
                    estado: getValue(registro.estado) ?? (formulario ? formulario.estado : 'PENDIENTE'),
                    nombreActividad: registro.nombreActividad // si existe
                };
            });
            // Filtrar solo registros con estado PENDIENTE para el dashboard
            const registrosPendientes = registrosConEstado.filter(registro => registro.estado === 'PENDIENTE' || !registro.estado);
            setRegistros(registrosPendientes);
            localStorage.setItem('registros', JSON.stringify(registrosConEstado)); // Guardar todos para histórico
            console.log('Registros pendientes cargados:', registrosPendientes);
            if (registrosPendientes && registrosPendientes.length > 0) {
                console.log('Ejemplo de registro pendiente:', registrosPendientes[0]);
            }
            setFormularios(formulariosRes.data);
        }
        catch (error) {
            // Si falla la API, intenta cargar desde localStorage
            const local = localStorage.getItem('registros');
            if (local) {
                const registrosLocal = JSON.parse(local);
                // Filtrar solo pendientes del localStorage también
                const registrosPendientes = registrosLocal.filter((registro) => registro.estado === 'PENDIENTE' || !registro.estado);
                setRegistros(registrosPendientes);
                console.log('Registros pendientes cargados desde localStorage:', registrosPendientes);
            }
            console.error('Error cargando registros o formularios:', error);
        }
        finally {
            setLoadingRegistros(false);
        }
    }, [userId]);
    useEffect(() => {
        loadRegistrosYFormularios();
    }, [loadRegistrosYFormularios]);
    // Función helper para obtener el nombre de la actividad
    const getNombreActividad = (idActividad) => {
        // Acepta idActividad como string o número
        const id = typeof idActividad === 'string' ? idActividad : String(idActividad);
        const actividad = actividades.find(a => a.idActividad === id);
        return actividad ? actividad.nombreActividad : idActividad ? String(idActividad) : '—';
    };
    // Función helper para obtener el nombre de la materia de un registro
    const getNombreMateria = (idFormulario) => {
        // Si no hay idFormulario, el registro está pendiente de validación
        if (!idFormulario || idFormulario === 'null' || idFormulario === 'undefined') {
            return 'Pendiente de validación';
        }
        // Buscar el formulario para obtener información
        const formulario = formularios.find(f => f.idFormulario === idFormulario);
        if (formulario) {
            return `Formulario ${formulario.idFormulario} (${formulario.estado})`;
        }
        // Si no se encuentra el formulario, mostrar información básica
        return `Formulario ${idFormulario}`;
    };
    // Crear o actualizar
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validaciones
        if (!form.idFormulario || form.idFormulario === 0) {
            alert('Por favor selecciona una materia');
            return;
        }
        if (!form.idActividad || form.idActividad === 0) {
            alert('Por favor selecciona una actividad');
            return;
        }
        if (!form.fechaRegistro || !form.horaInicio || !form.horaFin || !form.aula) {
            alert('Por favor completa todos los campos');
            return;
        }
        const horas = calcularHorasEfectivas(form.horaInicio, form.horaFin);
        try {
            // Buscar un formulario existente para el usuario
            let formularioExistente = formularios.find(f => f.codigoUsuario === userCode &&
                f.estado === 'PENDIENTE');
            let idFormularioParaRegistro;
            if (formularioExistente) {
                idFormularioParaRegistro = parseInt(formularioExistente.idFormulario);
            }
            else {
                // Crear un formulario temporal
                const formularioDTO = {
                    fechaCreacion: new Date().toISOString().split('T')[0],
                    estado: 'PENDIENTE',
                    codigoUsuario: userCode
                };
                try {
                    const formularioRes = await crearFormulario(formularioDTO);
                    idFormularioParaRegistro = parseInt(formularioRes.data.idFormulario);
                    // Actualizar la lista de formularios
                    setFormularios(prev => [...prev, formularioRes.data]);
                }
                catch (formularioError) {
                    console.error('Error creating formulario:', formularioError);
                    alert('No se pudo crear un formulario. Contacta al administrador.');
                    return;
                }
            }
            // Crear el registro de hora con el formulario asignado
            const dto = {
                fechaRegistro: form.fechaRegistro,
                horaInicio: form.horaInicio,
                horaFin: form.horaFin,
                horasEfectivas: horas,
                aula: form.aula,
                codigoUsuario: userCode,
                idActividad: form.idActividad,
                idFormulario: idFormularioParaRegistro,
            };
            const action = editing
                ? actualizarRegistroHora(editing.idRegistro, dto)
                : crearRegistroHora(dto);
            const res = await action;
            const saved = res.data;
            setRegistros(prev => {
                const nuevos = editing
                    ? prev.map(r => r.idRegistro === editing.idRegistro ? saved : r)
                    : [...prev, saved];
                localStorage.setItem('registros', JSON.stringify(nuevos));
                return nuevos;
            });
            setModalOpen(false);
            setEditing(null);
            setForm({
                fechaRegistro: '',
                horaInicio: '',
                horaFin: '',
                aula: '',
                idActividad: 0,
                idFormulario: 0,
            });
            // Recargar datos
            loadRegistrosYFormularios();
            // Mostrar mensaje de éxito
            alert(editing ? '✅ Registro actualizado exitosamente' : '✅ Registro creado exitosamente. Está pendiente de validación por el encargado.');
        }
        catch (error) {
            console.error('Error al guardar registro:', error);
            alert('Error al guardar el registro. Por favor, inténtalo de nuevo.');
        }
    };
    // Borrar
    const handleDelete = (id) => {
        if (!confirm('¿Estás seguro de eliminar este registro?'))
            return;
        eliminarRegistro(id)
            .then(() => {
            setRegistros(prev => {
                const nuevos = prev.filter(r => r.idRegistro !== id);
                localStorage.setItem('registros', JSON.stringify(nuevos));
                return nuevos;
            });
            loadRegistrosYFormularios();
            alert('✅ Registro eliminado exitosamente');
        })
            .catch(error => {
            console.error('Error eliminando registro:', error);
            alert('Error al eliminar el registro. Por favor, inténtalo de nuevo.');
        });
    };
    // Editar
    const handleEdit = (reg) => {
        if (reg.estado !== 'PENDIENTE') {
            alert('Solo se pueden editar registros pendientes');
            return;
        }
        setEditing(reg);
        setForm({
            fechaRegistro: reg.fechaRegistro,
            horaInicio: reg.horaInicio,
            horaFin: reg.horaFin,
            aula: reg.aula,
            idActividad: parseInt(reg.idActividad) || 0,
            idFormulario: parseInt(reg.idFormulario) || 0,
        });
        setModalOpen(true);
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
            case 'PENDIENTE':
                return 'bg-yellow-100 text-yellow-800';
            case 'APROBADO':
                return 'bg-green-100 text-green-800';
            case 'RECHAZADO':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Mis Registros de Horas" }), _jsx("p", { className: "text-gray-600", children: "Gestiona tus registros de horas trabajadas" })] }), _jsxs("button", { onClick: () => setModalOpen(true), className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors", children: [_jsx(Plus, { size: 20 }), "Nuevo Registro"] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-white p-4 rounded-lg shadow", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500", children: "Total de Registros" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: registros.length })] }), _jsxs("div", { className: "bg-white p-4 rounded-lg shadow", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500", children: "Horas Totales" }), _jsxs("p", { className: "text-2xl font-bold text-blue-600", children: [registros.reduce((total, reg) => total + (reg.horasEfectivas || 0), 0), "h"] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Registros de Horas" }) }), loadingRegistros ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Cargando registros..." })] })) : registros.length === 0 ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx("p", { className: "text-gray-500", children: "No hay registros de horas disponibles" }), _jsx("button", { onClick: () => setModalOpen(true), className: "mt-2 text-blue-600 hover:text-blue-700 font-medium", children: "Crear tu primer registro" })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Fecha" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Horario" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actividad" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Aula" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Horas" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Estado" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Acciones" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: registros.map((registro) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: formatDate(registro.fechaRegistro) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: [formatTime(registro.horaInicio), " - ", formatTime(registro.horaFin)] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: registro.nombreActividad || getNombreActividad(registro.idActividad) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: registro.aula }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: [registro.horasEfectivas, "h"] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(registro.estado || 'PENDIENTE')}`, children: registro.estado || 'PENDIENTE' }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: _jsxs("div", { className: "flex space-x-2", children: [registro.estado === 'PENDIENTE' && (_jsx("button", { onClick: () => handleEdit(registro), className: "text-blue-600 hover:text-blue-900", title: "Editar", children: _jsx(Edit2, { size: 16 }) })), _jsx("button", { onClick: () => handleDelete(registro.idRegistro), className: "text-red-600 hover:text-red-900", title: "Eliminar", children: _jsx(Trash2, { size: 16 }) })] }) })] }, registro.idRegistro))) })] }) }))] }), modalOpen && (_jsx("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: _jsxs("div", { className: "flex items-center justify-center min-h-screen px-4", children: [_jsx("div", { className: "fixed inset-0 bg-black opacity-30", onClick: () => setModalOpen(false) }), _jsxs("div", { className: "relative bg-white rounded-lg max-w-md w-full p-6", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-4", children: editing ? 'Editar Registro' : 'Nuevo Registro de Horas' }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Materia *" }), loadingMaterias ? (_jsx("div", { className: "text-sm text-gray-500", children: "Cargando materias..." })) : errorMaterias ? (_jsx("div", { className: "text-sm text-red-500", children: errorMaterias })) : materias.length === 0 ? (_jsx("div", { className: "text-sm text-red-500", children: "No tienes materias asignadas" })) : (_jsxs("select", { value: form.idFormulario, onChange: (e) => setForm(prev => ({ ...prev, idFormulario: parseInt(e.target.value) })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", required: true, children: [_jsx("option", { value: 0, children: "Selecciona una materia" }), materias.map((materia) => (_jsx("option", { value: materia.idMateria, children: materia.nombreMateria }, materia.idMateria)))] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Actividad *" }), _jsxs("select", { value: form.idActividad, onChange: (e) => setForm(prev => ({ ...prev, idActividad: parseInt(e.target.value) })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", required: true, children: [_jsx("option", { value: 0, children: "Selecciona una actividad" }), actividades.map((actividad) => (_jsx("option", { value: actividad.idActividad, children: actividad.nombreActividad }, actividad.idActividad)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Fecha *" }), _jsx("input", { type: "date", value: form.fechaRegistro, onChange: (e) => setForm(prev => ({ ...prev, fechaRegistro: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", required: true })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Hora Inicio *" }), _jsx("input", { type: "time", value: form.horaInicio, onChange: (e) => setForm(prev => ({ ...prev, horaInicio: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Hora Fin *" }), _jsx("input", { type: "time", value: form.horaFin, onChange: (e) => setForm(prev => ({ ...prev, horaFin: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", required: true })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Aula *" }), _jsx("input", { type: "text", value: form.aula, onChange: (e) => setForm(prev => ({ ...prev, aula: e.target.value })), placeholder: "Ej: L-3, Aula 101", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", required: true })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: () => {
                                                        setModalOpen(false);
                                                        setEditing(null);
                                                        setForm({
                                                            fechaRegistro: '',
                                                            horaInicio: '',
                                                            horaFin: '',
                                                            aula: '',
                                                            idActividad: 0,
                                                            idFormulario: 0,
                                                        });
                                                    }, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors", children: "Cancelar" }), _jsx("button", { type: "submit", className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors", children: editing ? 'Actualizar' : 'Crear' })] })] })] })] }) }))] }));
};
export default DashboardEstudiante;
