import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import useAuth from '../../hooks/useAuth';
import { calcularHorasEfectivas } from '../../utils/timeUtils';
import { listarMateriasPorUsuario } from '../../services/usuarioMateriaService';
import { listarMaterias } from '../../services/materiaService';
import {
    listarRegistrosPorUsuarioYFechas,
    crearRegistroHora,
    actualizarRegistroHora,
    eliminarRegistro,
} from '../../services/registroHoraService';
import type { Materia, RegistroHora, RegistroDTO, MateriaUsuario } from '../../types';

const DashboardEstudiante: React.FC = () => {
    const { user } = useAuth();
    const userId = user?.idUsuario ?? '';
    const userCode = user?.codigoUsuario ?? '';

    // State
    const [materias, setMaterias] = useState<Materia[]>([]);
    const [registros, setRegistros] = useState<RegistroHora[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<RegistroHora | null>(null);
    const [loadingMaterias, setLoadingMaterias] = useState(true);
    const [errorMaterias, setErrorMaterias] = useState<string | null>(null);
    const [form, setForm] = useState<{
        fechaRegistro: string;
        horaInicio: string;
        horaFin: string;
        actividad: string;
        aula: string;
        idActividad: string;
        idFormulario: string;
    }>({
        fechaRegistro: '',
        horaInicio: '',
        horaFin: '',
        actividad: '',
        aula: '',
        idActividad: '',
        idFormulario: '',
    });

    // Load materias
    const loadMaterias = useCallback(async () => {
        console.log('Cargando materias para usuario:', userId);
        console.log('Código de usuario:', userCode);
        console.log('Usuario completo:', user);
        setLoadingMaterias(true);
        setErrorMaterias(null);
        
        try {
            // Obtener todas las materias
            const todasLasMateriasRes = await listarMaterias();
            const todasLasMaterias = todasLasMateriasRes.data;
            console.log('Todas las materias:', todasLasMaterias);
            
            // Obtener las materias asignadas al usuario
            console.log('Llamando a listarMateriasPorUsuario con userId:', userId);
            const materiasUsuarioRes = await listarMateriasPorUsuario(String(userId));
            const materiasUsuario = materiasUsuarioRes.data;
            console.log('Respuesta completa de materias del usuario:', materiasUsuarioRes);
            console.log('Materias del usuario:', materiasUsuario);
            
            // Filtrar las materias que están asignadas al usuario
            const materiasAsignadas = todasLasMaterias.filter(materia => 
                materiasUsuario.some((m: MateriaUsuario) => m.nombreMateria === materia.nombreMateria)
            );
            
            console.log('Materias asignadas procesadas:', materiasAsignadas);
            setMaterias(materiasAsignadas);
        } catch (error) {
            console.error('Error cargando materias:', error);
            setErrorMaterias('Error al cargar las materias asignadas');
        } finally {
            setLoadingMaterias(false);
        }
    }, [userId, userCode, user]);

    useEffect(() => {
        loadMaterias();
    }, [loadMaterias]);

    // Load registros
    const loadRegistros = useCallback(() => {
        listarRegistrosPorUsuarioYFechas(userCode, '1900-01-01', '2099-12-31')
            .then(res => setRegistros(res.data as RegistroHora[]))
            .catch(error => {
                console.error('Error cargando registros:', error);
            });
    }, [userCode]);

    useEffect(() => {
        loadRegistros();
    }, [loadRegistros]);

    // Filtrado de pendientes
    const pendientes = registros.filter(r => r.estado === 'PENDIENTE');

    // Crear o actualizar
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const horas = calcularHorasEfectivas(form.horaInicio, form.horaFin);

        const dto: RegistroDTO = {
            fechaRegistro: form.fechaRegistro,
            horaInicio: form.horaInicio,
            horaFin: form.horaFin,
            horasEfectivas: horas,
            aula: form.aula,
            codigoUsuario: userCode,
            idActividad: form.idActividad,
            idFormulario: form.idFormulario,
        };

        const action = editing
            ? actualizarRegistroHora(editing.idRegistro, dto)
            : crearRegistroHora(dto);

        action
            .then(res => {
                const saved = res.data as RegistroHora;
                setRegistros(prev =>
                    editing
                        ? prev.map(r => r.idRegistro === editing.idRegistro ? saved : r)
                        : [...prev, saved]
                );
                setModalOpen(false);
                setEditing(null);
                setForm({
                    fechaRegistro: '',
                    horaInicio: '',
                    horaFin: '',
                    actividad: '',
                    aula: '',
                    idActividad: '',
                    idFormulario: '',
                });
            })
            .catch(error => {
                console.error('Error al guardar registro:', error);
                alert('Error al guardar el registro. Por favor, inténtalo de nuevo.');
            });
    };

    // Borrar
    const handleDelete = (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
        
        eliminarRegistro(id)
            .then(() => setRegistros(prev => prev.filter(r => r.idRegistro !== id)))
            .catch(error => {
                console.error('Error eliminando registro:', error);
                alert('Error al eliminar el registro. Por favor, inténtalo de nuevo.');
            });
    };

    // Editar
    const handleEdit = (reg: RegistroHora) => {
        if (reg.estado !== 'PENDIENTE') return;
        setEditing(reg);
        setForm({
            fechaRegistro: reg.fechaRegistro,
            horaInicio: reg.horaInicio,
            horaFin: reg.horaFin,
            actividad: reg.actividad,
            aula: reg.aula,
            idActividad: reg.idFormulario,    // si tuvieras idActividad real, cámbialo
            idFormulario: reg.idFormulario,
        });
        setModalOpen(true);
    };

    return (
        <div className="space-y-8 p-4">
            {/* Tabla de pendientes */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#003c71]">
                        Mis registros pendientes
                    </h2>
                    <button
                        onClick={() => {
                            setForm({
                                fechaRegistro: '',
                                horaInicio: '',
                                horaFin: '',
                                actividad: '',
                                aula: '',
                                idActividad: '',
                                idFormulario: '',
                            });
                            setModalOpen(true);
                        }}
                        disabled={loadingMaterias || !!errorMaterias || materias.length === 0}
                        className={`flex items-center gap-2 text-sm px-4 py-2 rounded ${
                            !loadingMaterias && !errorMaterias && materias.length > 0
                                ? 'text-white bg-[#003c71] hover:bg-[#002f59]' 
                                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                        }`}
                    >
                        <Plus size={16} /> Nuevo registro
                    </button>
                </div>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-gray-600 border-b">
                            <th className="py-2">Fecha</th>
                            <th>Inicio</th>
                            <th>Fin</th>
                            <th>Actividad</th>
                            <th>Aula</th>
                            <th>Horas</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingMaterias ? (
                            <tr>
                                <td colSpan={8} className="py-4 text-center text-gray-500">
                                    Cargando materias...
                                </td>
                            </tr>
                        ) : errorMaterias ? (
                            <tr>
                                <td colSpan={8} className="py-4 text-center">
                                    <div className="text-red-600 text-sm">{errorMaterias}</div>
                                    <button
                                        onClick={loadMaterias}
                                        className="text-sm text-blue-600 hover:underline mt-2"
                                    >
                                        Reintentar
                                    </button>
                                </td>
                            </tr>
                        ) : materias.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-4 text-center text-red-600 text-sm">
                                    No tienes materias asignadas. Contacta al encargado.
                                </td>
                            </tr>
                        ) : pendientes.length ? pendientes.map(reg => (
                            <tr key={reg.idRegistro} className="border-b hover:bg-gray-50">
                                <td className="py-2">{reg.fechaRegistro}</td>
                                <td>{reg.horaInicio}</td>
                                <td>{reg.horaFin}</td>
                                <td>{reg.nombreActividad}</td>
                                <td>{reg.aula}</td>
                                <td>{reg.horasEfectivas}</td>
                                <td>{reg.estado}</td>
                                <td className="flex gap-2">
                                    <button onClick={() => handleEdit(reg)} className="text-blue-600 hover:underline">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(reg.idRegistro)} className="text-red-600 hover:underline">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={8} className="py-4 text-center text-gray-500">
                                    No tienes registros pendientes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal crear/editar */}
            <Dialog
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditing(null); }}
                className="fixed inset-0 z-50 flex items-center justify-center"
            >
                <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <Dialog.Title className="text-lg font-semibold mb-4">
                        {editing ? 'Editar registro' : 'Nuevo registro'}
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={form.fechaRegistro}
                            onChange={e => setForm(f => ({ ...f, fechaRegistro: e.target.value }))}
                            required
                        />
                        <div className="flex gap-2">
                            <input
                                type="time"
                                className="w-1/2 border rounded px-3 py-2"
                                value={form.horaInicio}
                                onChange={e => setForm(f => ({ ...f, horaInicio: e.target.value }))}
                                required
                            />
                            <input
                                type="time"
                                className="w-1/2 border rounded px-3 py-2"
                                value={form.horaFin}
                                onChange={e => setForm(f => ({ ...f, horaFin: e.target.value }))}
                                required
                            />
                        </div>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={form.idFormulario}
                            onChange={e => setForm(f => ({ ...f, idFormulario: e.target.value }))}
                            required
                        >
                            <option value="">Seleccionar materia</option>
                            {materias.map(m => (
                                <option key={m.idMateria} value={m.idMateria}>
                                    {m.nombreMateria}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Actividad"
                            className="w-full border rounded px-3 py-2"
                            value={form.actividad}
                            onChange={e => setForm(f => ({ ...f, actividad: e.target.value }))}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Aula"
                            className="w-full border rounded px-3 py-2"
                            value={form.aula}
                            onChange={e => setForm(f => ({ ...f, aula: e.target.value }))}
                            required
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => { setModalOpen(false); setEditing(null); }}
                                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded bg-[#003c71] text-white hover:bg-[#002f59]"
                            >
                                Guardar
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </Dialog>
        </div>
    );
};

export default DashboardEstudiante;
