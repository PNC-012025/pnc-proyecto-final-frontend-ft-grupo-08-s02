// src/pages/Dashboard/DashboardEstudiante.tsx

import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    CalendarDays,
    GraduationCap,
    Mail,
    School,
    Users,
    Plus,
    Trash2,
    Edit2
} from 'lucide-react';
import { Dialog } from '@headlessui/react';
import useAuth from '../../hooks/useAuth';

interface RegistroHora {
    id: number;
    estudianteId: string;
    estudianteNombre: string;     // ← nuevo
    estudianteApellido: string;   // ← nuevo
    fecha: string;
    horaInicio: string;
    horaFin: string;
    actividad: string;
    aula: string;
    horasEfectivas: number;
    estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
}

const calcularHoras = (inicio: string, fin: string): number => {
    const [hiH, hiM] = inicio.split(':').map(Number);
    const [hfH, hfM] = fin.split(':').map(Number);
    const diff = Math.max(0, (hfH * 60 + hfM) - (hiH * 60 + hiM));
    return Math.round((diff / 60) * 100) / 100;
};

const DashboardEstudiante: React.FC = () => {
    const { user } = useAuth();
    const userId = user?.id ?? '';
    const nombre = user?.nombre ?? '';
    const apellido = user?.apellido ?? '';

    // Carga inicial: todos los registros de este estudiante
    const [registros, setRegistros] = useState<RegistroHora[]>(() => {
        const all = JSON.parse(localStorage.getItem('registros') || '[]') as RegistroHora[];
        return all.filter(r => r.estudianteId === userId);
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<RegistroHora | null>(null);

    const [form, setForm] = useState<
        Omit<RegistroHora, 'id' | 'horasEfectivas' | 'estado' | 'estudianteId' | 'estudianteNombre' | 'estudianteApellido'>
    >({
        fecha: '',
        horaInicio: '',
        horaFin: '',
        actividad: '',
        aula: ''
    });

    // Sincroniza localStorage cada vez que cambian los registros de este estudiante
    useEffect(() => {
        const all = JSON.parse(localStorage.getItem('registros') || '[]') as RegistroHora[];
        const otros = all.filter(r => r.estudianteId !== userId);
        localStorage.setItem('registros', JSON.stringify([...otros, ...registros]));
    }, [registros, userId]);

    const handleSubmit = () => {
        const horasEfectivas = calcularHoras(form.horaInicio, form.horaFin);

        if (editing) {
            setRegistros(prev =>
                prev.map(r =>
                    r.id === editing.id
                        ? {
                            ...r,
                            ...form,
                            horasEfectivas,
                            estudianteNombre: nombre,     // ← inyectado
                            estudianteApellido: apellido  // ← inyectado
                        }
                        : r
                )
            );
        } else {
            const nuevo: RegistroHora = {
                id: Date.now(),
                estudianteId: userId,
                estudianteNombre: nombre,     // ← inyectado
                estudianteApellido: apellido, // ← inyectado
                ...form,
                horasEfectivas,
                estado: 'PENDIENTE'
            };
            setRegistros(prev => [...prev, nuevo]);
        }

        setModalOpen(false);
        setForm({ fecha: '', horaInicio: '', horaFin: '', actividad: '', aula: '' });
        setEditing(null);
    };

    const handleDelete = (id: number) => {
        setRegistros(prev => prev.filter(r => r.id !== id));
    };

    const handleEdit = (reg: RegistroHora) => {
        setEditing(reg);
        setForm({
            fecha: reg.fecha,
            horaInicio: reg.horaInicio,
            horaFin: reg.horaFin,
            actividad: reg.actividad,
            aula: reg.aula
        });
        setModalOpen(true);
    };

    // Calcula horas aprobadas del estudiante
    const all = JSON.parse(localStorage.getItem('registros') || '[]') as RegistroHora[];
    const horasAprobadas = all
        .filter(r => r.estudianteId === userId && r.estado === 'APROBADO')
        .reduce((sum, r) => sum + r.horasEfectivas, 0);
    const porcentaje = Math.min((horasAprobadas / 600) * 100, 100);

    // Solo muestra registros con estado 'PENDIENTE'
    const pendientes = registros.filter(r => r.estado === 'PENDIENTE');

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

            {/* Tabla de registros pendientes */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#003c71]">Mis registros pendientes</h2>
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
                                <td colSpan={7} className="py-4 text-center text-gray-500">
                                    No tienes registros pendientes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de nuevo/editar registro */}
            <Dialog
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditing(null); }}
                className="fixed inset-0 z-50 flex items-center justify-center"
            >
                <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <Dialog.Title className="text-lg font-semibold mb-4">
                        {editing ? 'Editar registro' : 'Nuevo registro'}
                    </Dialog.Title>
                    <form
                        onSubmit={e => { e.preventDefault(); handleSubmit(); }}
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
