// src/pages/Dashboard/DashboardEncargado.tsx
import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import useAuth from '../../hooks/useAuth';
import type { Usuario, Role } from '../../types';

interface RegistroHora {
    id: number;
    estudianteId: string;
    horasEfectivas: number;
    estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
}

const DashboardEncargado: React.FC = () => {
    const { user, logout } = useAuth();

    // ——— Usuarios ———
    const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
        const data = localStorage.getItem('usuarios');
        return data ? JSON.parse(data) : [];
    });
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [newUser, setNewUser] = useState<Omit<Usuario, 'id'>>({
        nombre: '',
        apellido: '',
        email: '',
        rol: 'ESTUDIANTE' as Role,
        codigoUsuario: '',
    });
    const [newPassword, setNewPassword] = useState('');

    // Persistir usuarios en localStorage
    useEffect(() => {
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }, [usuarios]);

    const handleCreateUser = () => {
        const id = Date.now().toString();
        const created: Usuario = { id, ...newUser };
        // (Opcional) guardar contraseña en otro storage o enviar al backend
        setUsuarios(prev => [...prev, created]);
        setUserModalOpen(false);
        setNewUser({ nombre: '', apellido: '', email: '', rol: 'ESTUDIANTE', codigoUsuario: '' });
        setNewPassword('');
    };

    // ——— Registros ———
    const [registros, setRegistros] = useState<RegistroHora[]>(() => {
        const data = localStorage.getItem('registros');
        return data ? JSON.parse(data) : [];
    });

    // Sumar horas aprobadas por estudiante
    const horasPorEstudiante: Record<string, number> = {};
    usuarios.forEach(u => {
        const total = registros
            .filter(r => r.estudianteId === u.id && r.estado === 'APROBADO')
            .reduce((sum, r) => sum + r.horasEfectivas, 0);
        horasPorEstudiante[u.id] = total;
    });

    return (
        <div className="space-y-6 p-4">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#003c71]">
                        Bienvenido, {user?.nombre}
                    </h1>
                    <p className="text-gray-600">
                        Desde aquí puedes gestionar usuarios y validar registros
                    </p>
                </div>
                <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Cerrar sesión
                </button>
            </header>

            {/* ——— Sección de Usuarios ——— */}
            <section className="bg-white rounded-xl shadow p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-[#003c71]">Usuarios</h2>
                    <button
                        onClick={() => setUserModalOpen(true)}
                        className="flex items-center gap-2 bg-[#003c71] text-white px-4 py-2 rounded hover:bg-[#002f59]"
                    >
                        <UserPlus size={16} /> Nuevo usuario
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="px-3 py-2">Nombre</th>
                                <th className="px-3 py-2">Email</th>
                                <th className="px-3 py-2">Rol</th>
                                <th className="px-3 py-2">Código</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map(u => (
                                <tr key={u.id} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2">
                                        {u.nombre} {u.apellido}
                                    </td>
                                    <td className="px-3 py-2">{u.email}</td>
                                    <td className="px-3 py-2">{u.rol}</td>
                                    <td className="px-3 py-2">{u.codigoUsuario}</td>
                                </tr>
                            ))}
                            {usuarios.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                                        No hay usuarios registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ——— Modal para crear usuario ——— */}
            <Dialog
                open={userModalOpen}
                onClose={() => setUserModalOpen(false)}
                className="fixed inset-0 z-50 flex items-center justify-center"
            >
                <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <Dialog.Title className="text-lg font-semibold mb-4">
                        Crear nuevo usuario
                    </Dialog.Title>
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            handleCreateUser();
                        }}
                        className="space-y-4"
                    >
                        <input
                            type="text"
                            placeholder="Nombre"
                            value={newUser.nombre}
                            onChange={e => setNewUser({ ...newUser, nombre: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Apellido"
                            value={newUser.apellido}
                            onChange={e => setNewUser({ ...newUser, apellido: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={newUser.email}
                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                        <select
                            value={newUser.rol}
                            onChange={e => setNewUser({ ...newUser, rol: e.target.value as Role })}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="ESTUDIANTE">Estudiante</option>
                            <option value="INSTRUCTOR_SOCIAL">Instructor Social</option>
                            <option value="INSTRUCTOR_REMUNERADO">Instructor Remunerado</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Código de usuario"
                            value={newUser.codigoUsuario}
                            onChange={e => setNewUser({ ...newUser, codigoUsuario: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setUserModalOpen(false)}
                                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded bg-[#003c71] text-white hover:bg-[#002f59]"
                            >
                                Crear
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </Dialog>

            {/* ——— Avance por estudiante ——— */}
            <section className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-semibold text-[#003c71] mb-4">
                    Progreso de Estudiantes
                </h2>
                <div className="space-y-4">
                    {usuarios.map(u => {
                        const aprobadas = horasPorEstudiante[u.id] || 0;
                        const pct = Math.min((aprobadas / 600) * 100, 100);
                        return (
                            <div key={u.id} className="space-y-1">
                                <p className="font-medium">{u.nombre} {u.apellido} ({u.email})</p>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-green-500 h-3 rounded-full"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <p className="text-sm text-gray-600">{aprobadas} / 600 horas</p>
                            </div>
                        );
                    })}
                    {usuarios.length === 0 && (
                        <p className="text-gray-500">No hay estudiantes registrados.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default DashboardEncargado;
