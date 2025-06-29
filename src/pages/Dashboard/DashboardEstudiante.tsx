import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import useAuth from '../../hooks/useAuth';
import { calcularHorasEfectivas } from '../../utils/timeUtils';
import { listarMateriasPorUsuario } from '../../services/usuarioMateriaService';
import {
    listarRegistrosPorUsuarioYFechas,
    crearRegistroHora,
    actualizarRegistroHora,
    eliminarRegistro,
} from '../../services/registroHoraService';
import type { Materia, RegistroHora, RegistroDTO } from '../../types';

const DashboardEstudiante: React.FC = () => {
    const { user } = useAuth();
    const userId = user?.codigoUsuario ?? '';

    // State
    const [materias, setMaterias] = useState<Materia[]>([]);
    const [materiaSel, setMateriaSel] = useState<string>('');
    const [registros, setRegistros] = useState<RegistroHora[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<RegistroHora | null>(null);
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
    const loadMaterias = useCallback(() => {
        listarMateriasPorUsuario(userId)
            .then(res => {
                const data = res.data as Materia[];
                setMaterias(data);
                setMateriaSel(data[0]?.idMateria ?? '');
            })
            .catch(console.error);
    }, [userId]);

    useEffect(() => {
        loadMaterias();
    }, [loadMaterias]);

    // Load registros
    const loadRegistros = useCallback(() => {
        listarRegistrosPorUsuarioYFechas(userId, '1900-01-01', '2099-12-31')
            .then(res => setRegistros(res.data as RegistroHora[]))
            .catch(console.error);
    }, [userId]);

    useEffect(() => {
        loadRegistros();
    }, [loadRegistros]);

    // Cuando cambie materia seleccionada, actualizo idFormulario en el form
    useEffect(() => {
        setForm(f => ({ ...f, idFormulario: materiaSel }));
    }, [materiaSel]);

    // Filtrado de pendientes
    const pendientes = registros.filter(r =>
        r.estado === 'PENDIENTE' &&
        (!materiaSel || r.idFormulario === materiaSel)
    );

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
            codigoUsuario: userId,
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
                    idFormulario: materiaSel,
                });
            })
            .catch(console.error);
    };

    // Borrar
    const handleDelete = (id: string) => {
        eliminarRegistro(id)
            .then(() => setRegistros(prev => prev.filter(r => r.idRegistro !== id)))
            .catch(console.error);
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
            {/* Selector de materia */}
            <div className="flex items-center gap-2">
                <label className="font-medium">Materia:</label>
                <select
                    value={materiaSel}
                    onChange={e => setMateriaSel(e.target.value)}
                    className="border rounded px-3 py-2"
                >
                    {materias.map(m => (
                        <option key={m.idMateria} value={m.idMateria}>
                            {m.nombreMateria}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tabla de pendientes */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#003c71]">
                        Mis registros pendientes
                    </h2>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-2 text-sm text-white bg-[#003c71] px-4 py-2 rounded"
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
                        {pendientes.length ? pendientes.map(reg => (
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
