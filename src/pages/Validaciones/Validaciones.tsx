import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { listarRegistros } from '../../services/registroHoraService';
import { listarUsuarios } from '../../services/userService';
import { listarMaterias } from '../../services/materiaService';
import { listarActividades } from '../../services/actividadService';
import { crearValidacion, rechazarFormulario } from '../../services/validacionService';
import type { RegistroHora, Usuario, Materia, Actividad, ValidacionDTO } from '../../types';
import api from '../../services/api';

const ITEMS_PER_PAGE = 15;

const ValidacionesPage: React.FC = () => {
    const { user } = useAuth();

    // Verificar si el usuario tiene permisos para validar
    const canValidate = user?.rol === 'ENCARGADO';

    const [registros, setRegistros] = useState<RegistroHora[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [materias, setMaterias] = useState<Materia[]>([]);
    const [actividades, setActividades] = useState<Actividad[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchCodigo, setSearchCodigo] = useState('');
    const [page, setPage] = useState(1);
    const [processing, setProcessing] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [registrosRes, usuariosRes, materiasRes, actividadesRes] = await Promise.all([
                api.get('/api/registros/horas'),
                api.get('/api/usuarios/list'),
                api.get('/api/materias'),
                api.get('/api/actividades')
            ]);

            const getValue = (val: any) => Array.isArray(val) ? val[0] : val;
            
            const registrosData = getValue(registrosRes.data);
            const usuariosData = getValue(usuariosRes.data);
            const materiasData = getValue(materiasRes.data);
            const actividadesData = getValue(actividadesRes.data);

            setRegistros(registrosData || []);
            setUsuarios(usuariosData || []);
            setMaterias(materiasData || []);
            setActividades(actividadesData || []);
        } catch (error) {
            console.error('Error cargando datos:', error);
            alert('Error cargando datos. Por favor, recarga la página.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getCodigoEstudiante = (registro: RegistroHora) => {
        return registro.codigoUsuario || '—';
    };

    const getNombreEstudiante = (registro: RegistroHora) => {
        const usuario = usuarios.find(u => u.codigoUsuario === registro.codigoUsuario);
        return usuario ? `${usuario.nombre} ${usuario.apellido}` : registro.codigoUsuario || '—';
    };

    const getNombreMateria = (registro: RegistroHora) => {
        // Buscar la materia a través del formulario o directamente
        if (registro.idFormulario) {
            // Aquí podrías buscar la materia asociada al formulario
            return `Formulario ${registro.idFormulario}`;
        }
        return '—';
    };

    const getNombreActividad = (registro: RegistroHora) => {
        const actividad = actividades.find(a => a.idActividad === registro.idActividad);
        return actividad ? actividad.nombreActividad : registro.idActividad || '—';
    };

    const actualizarEstado = async (registroId: string, nuevoEstado: 'APROBADO' | 'RECHAZADO') => {
        // Verificar permisos
        if (!canValidate) {
            alert('❌ No tienes permisos para validar registros. Solo los encargados pueden realizar esta acción.');
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
                const validacionDTO: ValidacionDTO = {
                    idFormulario: registro.idFormulario,
                    idEncargado: user?.idUsuario || '',
                    estado: 'APROBADO',
                    observacion: undefined
                };

                console.log('🔍 Debug - Aprobando formulario:', registro.idFormulario);
                console.log('🔍 Debug - DTO de validación (APROBADO):', validacionDTO);
                response = await crearValidacion(validacionDTO);
            } else {
                // Usar endpoint específico para rechazar
                console.log('🔍 Debug - Rechazando formulario:', registro.idFormulario);
                response = await rechazarFormulario(registro.idFormulario, 'Registro rechazado por el encargado');
            }

            console.log('✅ Respuesta del servidor:', response);

            // Recargar datos desde el backend en lugar de actualizar solo el estado local
            console.log('🔄 Recargando datos desde el backend...');
            await loadData();

            alert(`✅ Registro ${nuevoEstado.toLowerCase()} exitosamente`);
        } catch (error: any) {
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
            } else if (error.response?.status === 403) {
                errorMessage = '❌ Acceso denegado. No tienes permisos para esta acción.';
            } else if (error.response?.status === 404) {
                errorMessage = '❌ Recurso no encontrado. El formulario o registro no existe.';
            } else if (error.response?.status >= 500) {
                errorMessage = '❌ Error del servidor. Contacta al administrador.';
            }
            
            alert(errorMessage);
        } finally {
            setProcessing(null);
        }
    };

    const registrosFiltrados = useMemo(() => {
        const term = searchCodigo.trim().toLowerCase();
        return registros.filter(r =>
            r.estado === 'PENDIENTE' &&
            getCodigoEstudiante(r).toLowerCase().includes(term)
        );
    }, [registros, searchCodigo]);

    const pageCount = Math.max(1, Math.ceil(registrosFiltrados.length / ITEMS_PER_PAGE));
    const paginated = useMemo(
        () => registrosFiltrados.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
        [registrosFiltrados, page]
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    };

    const formatTime = (timeString: any) => {
        if (!timeString || typeof timeString !== 'string') return '--:--';
        return timeString.substring(0, 5); // Mostrar solo HH:MM
    };

    if (loading) {
        return (
            <div className="space-y-6 p-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#003c71]">Validaciones de Registros</h2>
                    <span className="text-gray-600">Usuario: <strong>{user?.nombre}</strong></span>
                </div>
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Cargando registros...</span>
                </div>
            </div>
        );
    }

    // Verificar permisos de acceso
    if (!canValidate) {
        return (
            <div className="space-y-6 p-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#003c71]">Validaciones de Registros</h2>
                    <span className="text-gray-600">Usuario: <strong>{user?.nombre}</strong></span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="text-red-600 text-lg font-semibold mb-2">
                        ❌ Acceso Denegado
                    </div>
                    <p className="text-red-700">
                        Solo los usuarios con rol <strong>ENCARGADO</strong> pueden acceder a esta página.
                    </p>
                    <p className="text-red-600 mt-2">
                        Tu rol actual: <strong>{user?.rol || 'No definido'}</strong>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#003c71]">Validaciones de Registros</h2>
                <span className="text-gray-600">Usuario: <strong>{user?.nombre}</strong></span>
            </div>

            <div className="flex items-center gap-4">
                <label htmlFor="searchCodigo" className="font-medium">Buscar por código:</label>
                <input
                    id="searchCodigo"
                    type="text"
                    placeholder="Escribe el código..."
                    className="border rounded px-3 py-1"
                    value={searchCodigo}
                    onChange={e => { setSearchCodigo(e.target.value); setPage(1); }}
                />
                <span className="text-sm text-gray-500">
                    {registrosFiltrados.length} registros pendientes
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow divide-y divide-gray-200">
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
                    <tbody className="divide-y divide-gray-100">
                        {paginated.map(r => (
                            <tr key={r.idRegistro} className="hover:bg-gray-50">
                                <td className="px-4 py-2">{getCodigoEstudiante(r)}</td>
                                <td className="px-4 py-2">{getNombreEstudiante(r)}</td>
                                <td className="px-4 py-2">{getNombreMateria(r)}</td>
                                <td className="px-4 py-2">{formatDate(r.fechaRegistro)}</td>
                                <td className="px-4 py-2">{formatTime(r.horaInicio)}</td>
                                <td className="px-4 py-2">{formatTime(r.horaFin)}</td>
                                <td className="px-4 py-2">{getNombreActividad(r)}</td>
                                <td className="px-4 py-2">{r.aula}</td>
                                <td className="px-4 py-2">{r.horasEfectivas}h</td>
                                <td className="px-4 py-2 space-x-2">
                                    <button
                                        className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                        onClick={() => actualizarEstado(r.idRegistro, 'APROBADO')}
                                        disabled={processing === r.idRegistro}
                                        title="Aprobar"
                                    >
                                        {processing === r.idRegistro ? (
                                            <RefreshCw size={18} className="animate-spin" />
                                        ) : (
                                            <CheckCircle size={18} />
                                        )}
                                    </button>
                                    <button
                                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                        onClick={() => actualizarEstado(r.idRegistro, 'RECHAZADO')}
                                        disabled={processing === r.idRegistro}
                                        title="Rechazar"
                                    >
                                        {processing === r.idRegistro ? (
                                            <RefreshCw size={18} className="animate-spin" />
                                        ) : (
                                            <XCircle size={18} />
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paginated.length === 0 && (
                            <tr>
                                <td colSpan={10} className="px-4 py-2 text-center text-gray-500">
                                    No hay registros pendientes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <span>Página {page} de {pageCount}</span>
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
