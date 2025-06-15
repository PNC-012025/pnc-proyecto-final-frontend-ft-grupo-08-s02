import React, { useState, useEffect } from 'react';
import { BookOpen, CalendarDays, GraduationCap, Mail, School, Users, Plus, Trash2, Edit2 } from 'lucide-react';
import { Dialog } from '@headlessui/react';

interface RegistroHora {
    id: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    actividad: string;
    aula: string;
    horasEfectivas: number;
}

const calcularHoras = (inicio: string, fin: string): number => {
    const [hiH, hiM] = inicio.split(':').map(Number);
    const [hfH, hfM] = fin.split(':').map(Number);
    const inicioMin = hiH * 60 + hiM;
    const finMin = hfH * 60 + hfM;
    const diff = Math.max(0, finMin - inicioMin);
    return Math.round((diff / 60) * 100) / 100; // redondear a 2 decimales
};

const DashboardEstudiante: React.FC = () => {
    const [registros, setRegistros] = useState<RegistroHora[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<RegistroHora | null>(null);

    const [form, setForm] = useState<Omit<RegistroHora, 'id' | 'horasEfectivas'>>({
        fecha: '',
        horaInicio: '',
        horaFin: '',
        actividad: '',
        aula: ''
    });

    const handleSubmit = () => {
        const horasEfectivas = calcularHoras(form.horaInicio, form.horaFin);

        if (editing) {
            setRegistros(prev =>
                prev.map(r => (r.id === editing.id ? { ...editing, ...form, horasEfectivas } : r))
            );
        } else {
            const nuevoRegistro: RegistroHora = {
                id: Date.now(),
                ...form,
                horasEfectivas
            };
            setRegistros(prev => [...prev, nuevoRegistro]);
        }
        setModalOpen(false);
        setForm({ fecha: '', horaInicio: '', horaFin: '', actividad: '', aula: '' });
        setEditing(null);
    };

    const handleDelete = (id: number) => {
        setRegistros(prev => prev.filter(r => r.id !== id));
    };

    const handleEdit = (registro: RegistroHora) => {
        setEditing(registro);
        setForm({
            fecha: registro.fecha,
            horaInicio: registro.horaInicio,
            horaFin: registro.horaFin,
            actividad: registro.actividad,
            aula: registro.aula
        });
        setModalOpen(true);
    };

    return (
        <div className="space-y-8 p-4">
            {/* Horas sociales acumuladas */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#003c71] mb-2">Horas sociales acumuladas</h2>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div className="bg-blue-600 h-4 rounded-full" style={{ width: '16.5%' }}></div>
                </div>
                <p className="text-sm text-gray-600">99 horas acumuladas de 600</p>
            </div>

            {/* Registros recientes */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#003c71]">Mis registros</h2>
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
                        {registros.map(reg => (
                            <tr key={reg.id} className="border-b hover:bg-gray-50">
                                <td className="py-2">{reg.fecha}</td>
                                <td>{reg.horaInicio}</td>
                                <td>{reg.horaFin}</td>
                                <td>{reg.actividad}</td>
                                <td>{reg.aula}</td>
                                <td>{reg.horasEfectivas}</td>
                                <td className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(reg)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(reg.id)}
                                        className="text-red-600 hover:underline"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Enlaces de interés */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#003c71] mb-4">Enlaces de interés</h2>
                <div className="space-y-3">
                    <a href="#" className="flex items-center gap-3 p-3 rounded bg-gray-50 hover:bg-gray-100">
                        <BookOpen /> Biblioteca
                    </a>
                    <a href="#" className="flex items-center gap-3 p-3 rounded bg-gray-50 hover:bg-gray-100">
                        <CalendarDays /> Calendario académico
                    </a>
                    <a href="#" className="flex items-center gap-3 p-3 rounded bg-gray-50 hover:bg-gray-100">
                        <Users /> Directorio
                    </a>
                    <a href="#" className="flex items-center gap-3 p-3 rounded bg-gray-50 hover:bg-gray-100">
                        <GraduationCap /> E-campus
                    </a>
                    <a href="#" className="flex items-center gap-3 p-3 rounded bg-gray-50 hover:bg-gray-100">
                        <Mail /> Correo Electrónico
                    </a>
                    <a href="#" className="flex items-center gap-3 p-3 rounded bg-gray-50 hover:bg-gray-100">
                        <School /> Servicio social
                    </a>
                </div>
            </div>

            {/* Modal */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center">
                <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <Dialog.Title className="text-lg font-semibold mb-4">
                        {editing ? 'Editar registro' : 'Nuevo registro'}
                    </Dialog.Title>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit();
                        }}
                        className="space-y-4"
                    >
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={form.fecha}
                            onChange={(e) => setForm(prev => ({ ...prev, fecha: e.target.value }))}
                            required
                        />
                        <div className="flex gap-2">
                            <input
                                type="time"
                                className="w-1/2 border rounded px-3 py-2"
                                value={form.horaInicio}
                                onChange={(e) => setForm(prev => ({ ...prev, horaInicio: e.target.value }))}
                                required
                            />
                            <input
                                type="time"
                                className="w-1/2 border rounded px-3 py-2"
                                value={form.horaFin}
                                onChange={(e) => setForm(prev => ({ ...prev, horaFin: e.target.value }))}
                                required
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="Actividad realizada"
                            className="w-full border rounded px-3 py-2"
                            value={form.actividad}
                            onChange={(e) => setForm(prev => ({ ...prev, actividad: e.target.value }))}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Aula"
                            className="w-full border rounded px-3 py-2"
                            value={form.aula}
                            onChange={(e) => setForm(prev => ({ ...prev, aula: e.target.value }))}
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
