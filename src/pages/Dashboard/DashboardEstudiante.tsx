import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import useAuth from '../../hooks/useAuth';
import { calcularHorasEfectivas } from '../../utils/timeUtils';

interface PuenteLS { id_usuario: string; id_materia: string; }
interface MateriaLS { id: string; nombre: string; }

interface RegistroHora {
    id: number;
    estudianteId: string;
    estudianteNombre: string;
    estudianteApellido: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    actividad: string;
    aula: string;
    horasEfectivas: number;
    estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
    materia: string;
}

const DashboardEstudiante: React.FC = () => {
    const { user } = useAuth();
    const userId = user?.id ?? '';
    const nombre = user?.nombre ?? '';
    const apellido = user?.apellido ?? '';

    // Estados
    const [materias, setMaterias] = useState<MateriaLS[]>([]);
    const [materiaSel, setMateriaSel] = useState<string>('');
    const [registros, setRegistros] = useState<RegistroHora[]>(() => {
        const all = JSON.parse(localStorage.getItem('registros') || '[]') as RegistroHora[];
        return all.filter(r => r.estudianteId === userId);
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<RegistroHora | null>(null);
    const [form, setForm] = useState<Omit<
        RegistroHora,
        'id' | 'horasEfectivas' | 'estado' | 'estudianteId' | 'estudianteNombre' | 'estudianteApellido'
    >>({
        fecha: '',
        horaInicio: '',
        horaFin: '',
        actividad: '',
        aula: '',
        materia: ''
    });

    // Función para cargar materias asignadas
    const loadMaterias = useCallback(() => {
        const rawP = localStorage.getItem('usuarioXmateria');
        const rawM = localStorage.getItem('materias');
        if (!rawP || !rawM) {
            setMaterias([]);
            setMateriaSel('');
            return;
        }
        const puente = JSON.parse(rawP) as PuenteLS[];
        const catalog = JSON.parse(rawM) as MateriaLS[];
        const asignadas = puente
            .filter(p => p.id_usuario === userId)
            .map(p => p.id_materia);
        const lista = catalog.filter(m => asignadas.includes(m.id));
        setMaterias(lista);
        setMateriaSel(prev =>
            lista.some(m => m.id === prev) ? prev : lista[0]?.id ?? ''
        );
    }, [userId]);

    // 1) Al montar / cambiar userId
    useEffect(() => {
        loadMaterias();
    }, [loadMaterias]);

    // 2) Al recibir el evento de actualización desde el encargado
    useEffect(() => {
        const handler = () => loadMaterias();
        window.addEventListener('usuarioXmateriaChanged', handler);
        return () => window.removeEventListener('usuarioXmateriaChanged', handler);
    }, [loadMaterias]);

    // Mantener la materia seleccionada en el form
    useEffect(() => {
        setForm(prev => ({ ...prev, materia: materiaSel }));
    }, [materiaSel]);

    // Sincronizar registros con LS
    useEffect(() => {
        const all = JSON.parse(localStorage.getItem('registros') || '[]') as RegistroHora[];
        const otros = all.filter(r => r.estudianteId !== userId);
        localStorage.setItem('registros', JSON.stringify([...otros, ...registros]));
    }, [registros, userId]);

    const handleSubmit = () => {
        const horas = calcularHorasEfectivas(form.horaInicio, form.horaFin);
        if (editing) {
            setRegistros(prev =>
                prev.map(r =>
                    r.id === editing.id
                        ? { ...r, ...form, horasEfectivas: horas, estudianteNombre: nombre, estudianteApellido: apellido }
                        : r
                )
            );
        } else {
            const nuevo: RegistroHora = {
                id: Date.now(),
                estudianteId: userId,
                estudianteNombre: nombre,
                estudianteApellido: apellido,
                ...form,
                horasEfectivas: horas,
                estado: 'PENDIENTE'
            };
            setRegistros(prev => [...prev, nuevo]);
        }
        setModalOpen(false);
        setEditing(null);
        setForm({ fecha: '', horaInicio: '', horaFin: '', actividad: '', aula: '', materia: materiaSel });
    };

    const handleDelete = (id: number) => {
        setRegistros(prev => prev.filter(r => r.id !== id));
    };

    const handleEdit = (reg: RegistroHora) => {
        if (reg.estado !== 'PENDIENTE') return;
        setEditing(reg);
        setForm({
            fecha: reg.fecha,
            horaInicio: reg.horaInicio,
            horaFin: reg.horaFin,
            actividad: reg.actividad,
            aula: reg.aula,
            materia: reg.materia
        });
        setMateriaSel(reg.materia);
        setModalOpen(true);
    };

    const pendientes = registros.filter(r => r.estado === 'PENDIENTE');
    const all = JSON.parse(localStorage.getItem('registros') || '[]') as RegistroHora[];
    const horasAprobadas = all
        .filter(r => r.estudianteId === userId && r.estado === 'APROBADO')
        .reduce((sum, r) => sum + r.horasEfectivas, 0);
    const porcentaje = Math.min((horasAprobadas / 600) * 100, 100);

    return (
        <div className="space-y-8 p-4">
            {/* Progreso */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#003c71] mb-2">
                    Horas sociales acumuladas
                </h2>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div
                        className="bg-blue-600 h-4 rounded-full"
                        style={{ width: `${porcentaje}%` }}
                    />
                </div>
                <p className="text-sm text-gray-600">
                    {horasAprobadas} horas aprobadas de 600
                </p>
            </div>

            {/* Selector de materia */}
            <div className="flex items-center gap-2">
                <label className="font-medium">Materia:</label>
                <select
                    value={materiaSel}
                    onChange={e => setMateriaSel(e.target.value)}
                    className="border rounded px-3 py-2"
                >
                    {materias.map(m => (
                        <option key={m.id} value={m.id}>
                            {m.nombre}
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
                        className="flex items-center gap-2 text-sm text-white bg-[#003c71] px-4 py-2 rounded hover:bg-[#002f59]"
                    >
                        <Plus size={16} /> Nuevo registro
                    </button>
                </div>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-gray-600 border-b">
                            <th className="py-2">Fecha</th>
                            <th>Hora inicio</th>
                            <th>Hora fin</th>
                            <th>Actividad</th>
                            <th>Aula</th>
                            <th>Horas efectivas</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendientes.length > 0 ? (
                            pendientes.map(reg => (
                                <tr key={reg.id} className="border-b hover:bg-gray-50">
                                    <td className="py-2">{reg.fecha}</td>
                                    <td>{reg.horaInicio}</td>
                                    <td>{reg.horaFin}</td>
                                    <td>{reg.actividad}</td>
                                    <td>{reg.aula}</td>
                                    <td>{reg.horasEfectivas}</td>
                                    <td>{reg.estado}</td>
                                    <td className="flex gap-2">
                                        <button onClick={() => handleEdit(reg)} className="text-blue-600 hover:underline">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(reg.id)} className="text-red-600 hover:underline">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
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
                onClose={() => {
                    setModalOpen(false);
                    setEditing(null);
                }}
                className="fixed inset-0 z-50 flex items-center justify-center"
            >
                <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <Dialog.Title className="text-lg font-semibold mb-4">
                        {editing ? 'Editar registro' : 'Nuevo registro'}
                    </Dialog.Title>
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            handleSubmit();
                        }}
                        className="space-y-4"
                    >
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={form.fecha}
                            onChange={e => setForm(prev => ({ ...prev, fecha: e.target.value }))}
                            required
                        />
                        <div className="flex gap-2">
                            <input
                                type="time"
                                className="w-1/2 border rounded px-3 py-2"
                                value={form.horaInicio}
                                onChange={e => setForm(prev => ({ ...prev, horaInicio: e.target.value }))}
                                required
                            />
                            <input
                                type="time"
                                className="w-1/2 border rounded px-3 py-2"
                                value={form.horaFin}
                                onChange={e => setForm(prev => ({ ...prev, horaFin: e.target.value }))}
                                required
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="Actividad realizada"
                            className="w-full border rounded px-3 py-2"
                            value={form.actividad}
                            onChange={e => setForm(prev => ({ ...prev, actividad: e.target.value }))}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Aula"
                            className="w-full border rounded px-3 py-2"
                            value={form.aula}
                            onChange={e => setForm(prev => ({ ...prev, aula: e.target.value }))}
                            required
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setModalOpen(false);
                                    setEditing(null);
                                }}
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
