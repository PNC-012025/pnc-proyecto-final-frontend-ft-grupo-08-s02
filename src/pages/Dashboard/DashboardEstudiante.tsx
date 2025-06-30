import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import useAuth from '../../hooks/useAuth';
import { calcularHorasEfectivas } from '../../utils/timeUtils';
import { listarMateriasPorUsuario } from '../../services/usuarioMateriaService';
import { listarMaterias } from '../../services/materiaService';
import { listarActividades } from '../../services/actividadService';
import { listarFormulariosPorUsuario, crearFormulario } from '../../services/formularioService';
import {
    listarRegistrosPorUsuarioYFechas,
    crearRegistroHora,
    actualizarRegistroHora,
    eliminarRegistro,
} from '../../services/registroHoraService';
import type { Materia, RegistroHora, RegistroDTO, MateriaUsuario, Actividad, Formulario } from '../../types';

const DashboardEstudiante: React.FC = () => {
    const { user } = useAuth();
    const userId = user?.idUsuario ?? '';
    const userCode = user?.codigoUsuario ?? '';

    // State
    const [materias, setMaterias] = useState<Materia[]>([]);
    const [actividades, setActividades] = useState<Actividad[]>([]);
    const [formularios, setFormularios] = useState<Formulario[]>([]);
    const [registros, setRegistros] = useState<RegistroHora[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<RegistroHora | null>(null);
    const [loadingMaterias, setLoadingMaterias] = useState(true);
    const [errorMaterias, setErrorMaterias] = useState<string | null>(null);
    const [loadingRegistros, setLoadingRegistros] = useState(true);
    const [form, setForm] = useState<{
        fechaRegistro: string;
        horaInicio: string;
        horaFin: string;
        aula: string;
        idActividad: number;
        idFormulario: number;
    }>({
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
            const materiasAsignadas = todasLasMaterias.filter(materia => 
                materiasUsuario.some((m: MateriaUsuario) => m.nombreMateria === materia.nombreMateria)
            );
            
            setMaterias(materiasAsignadas);
        } catch (error) {
            console.error('Error cargando materias:', error);
            setErrorMaterias('Error al cargar las materias asignadas');
        } finally {
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
                } else if (user?.rol === 'INSTRUCTOR_REMUNERADO') {
                    return ['PRACTICA_LABORATORIO', 'PERMANENCIA', 'APOYO_PARCIAL', 'APOYO_INFORMATICO'].includes(actividad.nombreActividad);
                }
                return false;
            });
            setActividades(actividadesFiltradas);
            console.log('Actividades cargadas:', actividadesFiltradas);
        } catch (error) {
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

            const pad = (n: number) => n.toString().padStart(2, '0');
            const getValue = (val: any) => Array.isArray(val) ? val[0] : val;
            const registrosConEstado = registrosRes.data.map(registro => {
                const formulario = formulariosRes.data.find(f => 
                    String(f.idFormulario) === String(getValue(registro.id_formulario) ?? getValue(registro.idFormulario))
                );
                // Formatear fecha y hora si vienen como número
                let fechaRegistro = getValue(registro.fecha_registro) ?? getValue(registro.fechaRegistro);
                if (typeof fechaRegistro === 'number') fechaRegistro = `${fechaRegistro}-01-01`;

                let horaInicio = getValue(registro.hora_inicio) ?? getValue(registro.horaInicio);
                if (typeof horaInicio === 'number') horaInicio = `${pad(horaInicio)}:00:00`;

                let horaFin = getValue(registro.hora_fin) ?? getValue(registro.horaFin);
                if (typeof horaFin === 'number') horaFin = `${pad(horaFin)}:00:00`;

                return {
                    ...registro,
                    idRegistro: getValue(registro.id_registro_hora) ?? getValue(registro.idRegistro),
                    horaInicio,
                    horaFin,
                    idActividad: getValue(registro.id_actividad) ?? getValue(registro.idActividad),
                    idFormulario: getValue(registro.id_formulario) ?? getValue(registro.idFormulario),
                    horasEfectivas: getValue(registro.horas_efectivas) ?? getValue(registro.horasEfectivas),
                    fechaRegistro,
                    estado: formulario ? formulario.estado : undefined,
                    nombreActividad: registro.nombreActividad // si existe
                };
            });
            setRegistros(registrosConEstado);
            localStorage.setItem('registros', JSON.stringify(registrosConEstado));
            console.log('Registros cargados:', registrosConEstado);
            if (registrosConEstado && registrosConEstado.length > 0) {
                console.log('Ejemplo de registro:', registrosConEstado[0]);
            }
            setFormularios(formulariosRes.data);
        } catch (error) {
            // Si falla la API, intenta cargar desde localStorage
            const local = localStorage.getItem('registros');
            if (local) {
                const registrosLocal = JSON.parse(local);
                setRegistros(registrosLocal);
                console.log('Registros cargados desde localStorage:', registrosLocal);
            }
            console.error('Error cargando registros o formularios:', error);
        } finally {
            setLoadingRegistros(false);
        }
    }, [userId]);

    useEffect(() => {
        loadRegistrosYFormularios();
    }, [loadRegistrosYFormularios]);

    // Función helper para obtener el nombre de la actividad
    const getNombreActividad = (idActividad: string | number): string => {
        // Acepta idActividad como string o número
        const id = typeof idActividad === 'string' ? parseInt(idActividad) : idActividad;
        const actividad = actividades.find(a => a.idActividad === id);
        return actividad ? actividad.nombreActividad : idActividad ? String(idActividad) : '—';
    };

    // Función helper para obtener el nombre de la materia de un registro
    const getNombreMateria = (idFormulario: string): string => {
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
    const handleSubmit = async (e: FormEvent) => {
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
            let formularioExistente = formularios.find(f => 
                f.codigoUsuario === userCode && 
                f.estado === 'PENDIENTE'
            );

            let idFormularioParaRegistro: number;

            if (formularioExistente) {
                idFormularioParaRegistro = parseInt(formularioExistente.idFormulario);
            } else {
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
                } catch (formularioError) {
                    console.error('Error creating formulario:', formularioError);
                    alert('No se pudo crear un formulario. Contacta al administrador.');
                    return;
                }
            }

            // Crear el registro de hora con el formulario asignado
        const dto: RegistroDTO = {
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
                const saved = res.data as RegistroHora;
            
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
            
        } catch (error) {
            console.error('Error al guardar registro:', error);
            alert('Error al guardar el registro. Por favor, inténtalo de nuevo.');
        }
    };

    // Borrar
    const handleDelete = (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
        
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
    const handleEdit = (reg: RegistroHora) => {
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
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    };

    // Formatear hora
    const formatTime = (timeString: any) => {
        if (!timeString || typeof timeString !== 'string') return '--:--';
        return timeString.substring(0, 5); // Mostrar solo HH:MM
    };

    // Obtener color del estado
    const getEstadoColor = (estado: string) => {
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

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mis Registros de Horas</h1>
                    <p className="text-gray-600">Gestiona tus registros de horas trabajadas</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Nuevo Registro
                </button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Total de Registros</h3>
                    <p className="text-2xl font-bold text-gray-900">{registros.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Horas Totales</h3>
                    <p className="text-2xl font-bold text-blue-600">
                        {registros.reduce((total, reg) => total + (reg.horasEfectivas || 0), 0)}h
                    </p>
                </div>
            </div>

            {/* Tabla de Registros */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Registros de Horas</h2>
                </div>
                
                {loadingRegistros ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Cargando registros...</p>
                    </div>
                ) : registros.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">No hay registros de horas disponibles</p>
                    <button
                        onClick={() => setModalOpen(true)}
                            className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                            Crear tu primer registro
                    </button>
                </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Horario
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actividad
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aula
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Horas
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                        </tr>
                    </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {registros.map((registro) => (
                                    <tr key={registro.idRegistro} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(registro.fechaRegistro)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatTime(registro.horaInicio)} - {formatTime(registro.horaFin)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {registro.nombreActividad || getNombreActividad(registro.idActividad)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {registro.aula}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {registro.horasEfectivas}h
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(registro.estado)}`}>
                                                {registro.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                {registro.estado === 'PENDIENTE' && (
                                                    <button
                                                        onClick={() => handleEdit(registro)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Editar"
                                                    >
                                        <Edit2 size={16} />
                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(registro.idRegistro)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Eliminar"
                                                >
                                        <Trash2 size={16} />
                                    </button>
                                            </div>
                                </td>
                            </tr>
                                ))}
                    </tbody>
                </table>
                    </div>
                )}
            </div>

            {/* Modal para crear/editar registro */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black opacity-30" onClick={() => setModalOpen(false)}></div>

                        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                {editing ? 'Editar Registro' : 'Nuevo Registro de Horas'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Selector de Materia */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Materia *
                                    </label>
                                    {loadingMaterias ? (
                                        <div className="text-sm text-gray-500">Cargando materias...</div>
                                    ) : errorMaterias ? (
                                        <div className="text-sm text-red-500">{errorMaterias}</div>
                                    ) : materias.length === 0 ? (
                                        <div className="text-sm text-red-500">No tienes materias asignadas</div>
                                    ) : (
                                        <select
                                            value={form.idFormulario}
                                            onChange={(e) => setForm(prev => ({ ...prev, idFormulario: parseInt(e.target.value) }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value={0}>Selecciona una materia</option>
                                            {materias.map((materia) => (
                                                <option key={materia.idMateria} value={materia.idMateria}>
                                                    {materia.nombreMateria}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Selector de Actividad */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Actividad *
                                    </label>
                                    <select
                                        value={form.idActividad}
                                        onChange={(e) => setForm(prev => ({ ...prev, idActividad: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value={0}>Selecciona una actividad</option>
                                        {actividades.map((actividad) => (
                                            <option key={actividad.idActividad} value={actividad.idActividad}>
                                                {actividad.nombreActividad}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Fecha */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha *
                                    </label>
                        <input
                            type="date"
                            value={form.fechaRegistro}
                                        onChange={(e) => setForm(prev => ({ ...prev, fechaRegistro: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                                </div>

                                {/* Horario */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Hora Inicio *
                                        </label>
                            <input
                                type="time"
                                value={form.horaInicio}
                                            onChange={(e) => setForm(prev => ({ ...prev, horaInicio: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Hora Fin *
                                        </label>
                            <input
                                type="time"
                                value={form.horaFin}
                                            onChange={(e) => setForm(prev => ({ ...prev, horaFin: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                                </div>

                                {/* Aula */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Aula *
                                    </label>
                        <input
                            type="text"
                            value={form.aula}
                                        onChange={(e) => setForm(prev => ({ ...prev, aula: e.target.value }))}
                                        placeholder="Ej: L-3, Aula 101"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                                </div>

                                {/* Botones */}
                                <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                        onClick={() => {
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
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                            >
                                        {editing ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardEstudiante;
