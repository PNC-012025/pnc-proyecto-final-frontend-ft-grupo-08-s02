import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import useAuth from '../../hooks/useAuth';
import type { Usuario, Role, Materia } from '../../types';
import { crearUsuario, /* si usas el servicio */ } from '../../services/userService';
import { listarMaterias } from '../../services/materiaService';
import { asociarUsuarioConMateria } from '../../services/usuarioMateriaService';

const DashboardEncargado: React.FC = () => {
    const { user, logout } = useAuth();

    const [usuarios, setUsuarios] = useState<Usuario[]>(() =>
        JSON.parse(localStorage.getItem('usuarios') || '[]')
    );
    const [passwords, setPasswords] = useState<Record<string, string>>(() =>
        JSON.parse(localStorage.getItem('passwords') || '{}')
    );

    // **NUEVO**: materias y selección
    const [materias, setMaterias] = useState<Materia[]>([]);
    const [selectedMateria, setSelectedMateria] = useState<string>('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Usuario | null>(null);
    const [form, setForm] = useState<Omit<Usuario, 'id'>>({
        nombre: '',
        apellido: '',
        email: '',
        rol: 'ESTUDIANTE',
        codigoUsuario: '',
    });
    const [formPass, setFormPass] = useState('');

    // Persistir cambios
    useEffect(() => {
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }, [usuarios]);
    useEffect(() => {
        localStorage.setItem('passwords', JSON.stringify(passwords));
    }, [passwords]);

    // **NUEVO**: cargar materias
    useEffect(() => {
        const mts = JSON.parse(localStorage.getItem('materias') || '[]') as Materia[];
        if (mts.length) {
            setMaterias(mts);
        } else {
            listarMaterias().then(res => setMaterias(res.data));
        }
    }, []);

    const openNew = () => {
        setEditing(null);
        setForm({ nombre: '', apellido: '', email: '', rol: 'ESTUDIANTE', codigoUsuario: '' });
        setFormPass('');
        setSelectedMateria('');
        setModalOpen(true);
    };

    const openEdit = (u: Usuario) => {
        setEditing(u);
        setForm({
            nombre: u.nombre,
            apellido: u.apellido,
            email: u.email,
            rol: u.rol,
            codigoUsuario: u.codigoUsuario,
        });
        setFormPass(passwords[u.email] || '');
        // no cambiamos materia al editar
        setSelectedMateria('');
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        if (editing) {
            // Editar existente
            setUsuarios(prev =>
                prev.map(u => (u.id === editing.id ? { ...editing, ...form } : u))
            );
            if (formPass) {
                setPasswords(prev => ({ ...prev, [form.email]: formPass }));
            }
        } else {
            // Crear nuevo usuario
            const id = Date.now().toString();
            const nu: Usuario = { id, ...form };
            setUsuarios(prev => [...prev, nu]);
            setPasswords(prev => ({ ...prev, [form.email]: formPass }));

            // **NUEVO**: asociar materia
            if (selectedMateria) {
                await asociarUsuarioConMateria(id, selectedMateria);
            }
        }
        setModalOpen(false);
    };

    const handleDelete = (id: string) => {
        setUsuarios(prev => prev.filter(u => u.id !== id));
    };

    return (
        <div className="space-y-6 p-4">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-[#003c71]">
                    Bienvenido, {user?.nombre}
                </h1>
                <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Cerrar sesión
                </button>
            </header>

            <section className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#003c71]">Usuarios</h2>
                    <button
                        onClick={openNew}
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
                                <th className="px-3 py-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map(u => (
                                <tr key={u.id} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2">{u.nombre} {u.apellido}</td>
                                    <td className="px-3 py-2">{u.email}</td>
                                    <td className="px-3 py-2">{u.rol}</td>
                                    <td className="px-3 py-2">{u.codigoUsuario}</td>
                                    <td className="px-3 py-2 flex gap-2">
                                        <button onClick={() => openEdit(u)} className="text-blue-600">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(u.id)} className="text-red-600">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {usuarios.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-4 text-center text-gray-500">
                                        No hay usuarios.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <Dialog
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                className="fixed inset-0 z-50 flex items-center justify-center"
            >
                <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <Dialog.Title className="text-lg font-semibold mb-4">
                        {editing ? 'Editar usuario' : 'Nuevo usuario'}
                    </Dialog.Title>
                    <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Nombre"
                            value={form.nombre}
                            onChange={e => setForm({ ...form, nombre: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Apellido"
                            value={form.apellido}
                            onChange={e => setForm({ ...form, apellido: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={formPass}
                            onChange={e => setFormPass(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                        <select
                            value={form.rol}
                            onChange={e => setForm({ ...form, rol: e.target.value as Role })}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="ESTUDIANTE">Estudiante</option>
                            <option value="INSTRUCTOR_SOCIAL">Instructor Social</option>
                            <option value="INSTRUCTOR_REMUNERADO">Instructor Remunerado</option>
                        </select>

                        {/* Selección de materia */}
                        <select
                            value={selectedMateria}
                            onChange={e => setSelectedMateria(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            required={!editing}
                        >
                            <option value="" disabled>Selecciona una materia</option>
                            {materias.map(m => (
                                <option key={m.id} value={m.id}>{m.nombre}</option>
                            ))}
                        </select>

                        <input
                            type="text"
                            placeholder="Código de usuario"
                            value={form.codigoUsuario}
                            onChange={e => setForm({ ...form, codigoUsuario: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded bg-[#003c71] text-white hover:bg-[#002f59]"
                            >
                                {editing ? 'Guardar cambios' : 'Crear usuario'}
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </Dialog>
        </div>
    );
};

export default DashboardEncargado;
