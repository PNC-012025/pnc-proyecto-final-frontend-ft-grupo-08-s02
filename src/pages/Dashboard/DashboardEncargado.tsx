import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import useAuth from '../../hooks/useAuth';
import type { Usuario, Role, Materia } from '../../types';
import { asociarUsuarioConMateria } from '../../services/usuarioMateriaService';

type UsuarioConMateria = Usuario & { materiaId?: string };

const DashboardEncargado: React.FC = () => {
    const { user, logout } = useAuth();

    // — Usuarios, con materiaId opcional —
    const [usuarios, setUsuarios] = useState<UsuarioConMateria[]>(() =>
        JSON.parse(localStorage.getItem('usuarios') || '[]')
    );
    const [passwords, setPasswords] = useState<Record<string, string>>(() =>
        JSON.parse(localStorage.getItem('passwords') || '{}')
    );
    const [modalUserOpen, setModalUserOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UsuarioConMateria | null>(null);
    const [userForm, setUserForm] = useState<Omit<UsuarioConMateria, 'id'>>({
        nombre: '',
        apellido: '',
        email: '',
        rol: 'ESTUDIANTE',
        codigoUsuario: '',
        materiaId: '',
    });
    const [userPass, setUserPass] = useState('');
    const [selectedMateria, setSelectedMateria] = useState<string>('');
    const [userError, setUserError] = useState<string | null>(null);

    // Persistir usuarios y contraseñas
    useEffect(() => {
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }, [usuarios]);
    useEffect(() => {
        localStorage.setItem('passwords', JSON.stringify(passwords));
    }, [passwords]);

    // — Materias en localStorage —
    const [materias, setMaterias] = useState<Materia[]>(() =>
        JSON.parse(localStorage.getItem('materias') || '[]')
    );
    const [modalMatOpen, setModalMatOpen] = useState(false);
    const [editingMat, setEditingMat] = useState<Materia | null>(null);
    const [matForm, setMatForm] = useState<{ nombre: string }>({ nombre: '' });
    const [matError, setMatError] = useState<string | null>(null);

    useEffect(() => {
        localStorage.setItem('materias', JSON.stringify(materias));
    }, [materias]);

    // — Abrir modal usuario —
    const openNewUser = () => {
        setEditingUser(null);
        setUserForm({
            nombre: '', apellido: '', email: '',
            rol: 'ESTUDIANTE', codigoUsuario: '', materiaId: ''
        });
        setUserPass('');
        setSelectedMateria('');
        setUserError(null);
        setModalUserOpen(true);
    };
    const openEditUser = (u: UsuarioConMateria) => {
        setEditingUser(u);
        setUserForm({
            nombre: u.nombre, apellido: u.apellido,
            email: u.email, rol: u.rol,
            codigoUsuario: u.codigoUsuario,
            materiaId: u.materiaId || ''
        });
        setUserPass(passwords[u.email] || '');
        setSelectedMateria(u.materiaId || '');
        setUserError(null);
        setModalUserOpen(true);
    };

    // — Validar y guardar usuario —
    const handleSubmitUser = async () => {
        setUserError(null);
        // validar duplicados
        const dup = usuarios.some(u =>
            u.email === userForm.email || u.codigoUsuario === userForm.codigoUsuario
        );
        if (!editingUser && dup) {
            setUserError('Email o código ya registrado');
            return;
        }
        try {
            if (editingUser) {
                setUsuarios(prev => prev.map(u =>
                    u.id === editingUser.id
                        ? { ...editingUser, ...userForm, materiaId: selectedMateria }
                        : u
                ));
                if (userPass) setPasswords(p => ({ ...p, [userForm.email]: userPass }));
                if (selectedMateria) {
                    try {
                        await asociarUsuarioConMateria(editingUser.id, selectedMateria);
                    } catch (e) { console.error(e); }
                }
            } else {
                const id = Date.now().toString();
                const nuevo: UsuarioConMateria = {
                    id, ...userForm, materiaId: selectedMateria
                };
                setUsuarios(prev => [...prev, nuevo]);
                setPasswords(p => ({ ...p, [userForm.email]: userPass }));
                if (selectedMateria) {
                    try {
                        await asociarUsuarioConMateria(id, selectedMateria);
                    } catch (e) { console.error(e); }
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setModalUserOpen(false);
        }
    };

    const handleDeleteUser = (id: string) =>
        setUsuarios(prev => prev.filter(u => u.id !== id));

    // — Abrir modal materia —
    const openNewMat = () => {
        setEditingMat(null);
        setMatForm({ nombre: '' });
        setMatError(null);
        setModalMatOpen(true);
    };
    const openEditMat = (m: Materia) => {
        setEditingMat(m);
        setMatForm({ nombre: m.nombre });
        setMatError(null);
        setModalMatOpen(true);
    };

    // — Validar y guardar materia —
    const handleSubmitMat = () => {
        setMatError(null);
        const dup = materias.some(m =>
            m.nombre.trim().toLowerCase() === matForm.nombre.trim().toLowerCase()
        );
        if (!editingMat && dup) {
            setMatError('Materia duplicada');
            return;
        }
        try {
            if (editingMat) {
                setMaterias(prev => prev.map(m =>
                    m.id === editingMat.id ? { ...m, nombre: matForm.nombre } : m
                ));
            } else {
                const id = Date.now().toString();
                setMaterias(prev => [...prev, { id, nombre: matForm.nombre }]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setModalMatOpen(false);
        }
    };

    const handleDeleteMat = (id: string) =>
        setMaterias(prev => prev.filter(m => m.id !== id));

    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-[#003c71]">
                    Bienvenido, {user?.nombre}
                </h1>
                <button onClick={logout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                    Cerrar sesión
                </button>
            </header>

            {/* Usuarios */}
            <section className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#003c71]">Usuarios</h2>
                    <button onClick={openNewUser}
                        className="flex items-center gap-2 bg-[#003c71] text-white px-4 py-2 rounded hover:bg-[#002f59]">
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
                                <th className="px-3 py-2">Materia</th>
                                <th className="px-3 py-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map(u => {
                                const m = materias.find(x => x.id === u.materiaId);
                                return (
                                    <tr key={u.id} className="border-b hover:bg-gray-50">
                                        <td className="px-3 py-2">{u.nombre} {u.apellido}</td>
                                        <td className="px-3 py-2">{u.email}</td>
                                        <td className="px-3 py-2">{u.rol}</td>
                                        <td className="px-3 py-2">{u.codigoUsuario}</td>
                                        <td className="px-3 py-2">{m?.nombre || '—'}</td>
                                        <td className="px-3 py-2 flex gap-2">
                                            <button onClick={() => openEditUser(u)} className="text-blue-600"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteUser(u.id)} className="text-red-600"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {usuarios.length === 0 && (
                                <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-500">No hay usuarios.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Materias */}
            <section className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#003c71]">Materias</h2>
                    <button onClick={openNewMat}
                        className="flex items-center gap-2 bg-[#003c71] text-white px-4 py-2 rounded hover:bg-[#002f59]">
                        <Plus size={16} /> Nueva materia
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="px-3 py-2">Nombre</th>
                                <th className="px-3 py-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materias.map(m => (
                                <tr key={m.id} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2">{m.nombre}</td>
                                    <td className="px-3 py-2 flex gap-2">
                                        <button onClick={() => openEditMat(m)} className="text-blue-600"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteMat(m.id)} className="text-red-600"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {materias.length === 0 && (
                                <tr><td colSpan={2} className="px-3 py-4 text-center text-gray-500">No hay materias.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Modal Usuario */}
            <Dialog open={modalUserOpen} onClose={() => setModalUserOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <Dialog.Title className="text-lg font-semibold mb-4">{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</Dialog.Title>
                    <form onSubmit={e => { e.preventDefault(); handleSubmitUser() }} className="space-y-4">
                        <input type="text" placeholder="Nombre" className="w-full border rounded px-3 py-2" required value={userForm.nombre} onChange={e => setUserForm({ ...userForm, nombre: e.target.value })} />
                        <input type="text" placeholder="Apellido" className="w-full border rounded px-3 py-2" required value={userForm.apellido} onChange={e => setUserForm({ ...userForm, apellido: e.target.value })} />
                        <input type="email" placeholder="Email" className="w-full border rounded px-3 py-2" required value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
                        <input type="password" placeholder="Contraseña" className="w-full border rounded px-3 py-2" required value={userPass} onChange={e => setUserPass(e.target.value)} />
                        <select className="w-full border rounded px-3 py-2" value={userForm.rol} onChange={e => setUserForm({ ...userForm, rol: e.target.value as Role })}>
                            <option value="ESTUDIANTE">Estudiante</option>
                            <option value="INSTRUCTOR_SOCIAL">Instructor Social</option>
                            <option value="INSTRUCTOR_REMUNERADO">Instructor Remunerado</option>
                        </select>
                        <select className="w-full border rounded px-3 py-2" required={!editingUser} value={selectedMateria} onChange={e => setSelectedMateria(e.target.value)}>
                            <option value="" disabled>Selecciona una materia</option>
                            {materias.map(m => (
                                <option key={m.id} value={m.id}>{m.nombre}</option>
                            ))}
                        </select>
                        <input type="text" placeholder="Código" className="w-full border rounded px-3 py-2" required value={userForm.codigoUsuario} onChange={e => setUserForm({ ...userForm, codigoUsuario: e.target.value })} />
                        {userError && <div className="text-red-600 text-sm">{userError}</div>}
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setModalUserOpen(false)} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">Cancelar</button>
                            <button type="submit" className="px-4 py-2 rounded bg-[#003c71] text-white hover:bg-[#002f59]">{editingUser ? 'Guardar' : 'Crear'}</button>
                        </div>
                    </form>
                </Dialog.Panel>
            </Dialog>

            {/* Modal Materia */}
            <Dialog open={modalMatOpen} onClose={() => setModalMatOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <Dialog.Title className="text-lg font-semibold mb-4">{editingMat ? 'Editar materia' : 'Nueva materia'}</Dialog.Title>
                    <form onSubmit={e => { e.preventDefault(); handleSubmitMat() }} className="space-y-4">
                        <input type="text" placeholder="Nombre materia" className="w-full border rounded px-3 py-2" required value={matForm.nombre} onChange={e => setMatForm({ nombre: e.target.value })} />
                        {matError && <div className="text-red-600 text-sm">{matError}</div>}
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setModalMatOpen(false)} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">Cancelar</button>
                            <button type="submit" className="px-4 py-2 rounded bg-[#003c71] text-white hover:bg-[#002f59]">{editingMat ? 'Guardar' : 'Crear'}</button>
                        </div>
                    </form>
                </Dialog.Panel>
            </Dialog>
        </div>
    );
};

export default DashboardEncargado;
