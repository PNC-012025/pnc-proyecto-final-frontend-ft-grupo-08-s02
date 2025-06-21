import React, { useState, useEffect, useMemo } from 'react';
import { Plus, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import useAuth from '../../hooks/useAuth';
import type { Usuario, Role, Materia } from '../../types';
import { asociarUsuarioConMateria } from '../../services/usuarioMateriaService';

type UsuarioConMateria = Usuario & { materiaId?: string };
const ITEMS_PER_PAGE = 10;

const DashboardEncargado: React.FC = () => {
    const { user, logout } = useAuth();

    // Buscadores
    const [searchUsuario, setSearchUsuario] = useState('');
    const [searchMateria, setSearchMateria] = useState('');

    // Paginación
    const [userPage, setUserPage] = useState(1);
    const [matPage, setMatPage] = useState(1);

    // Usuarios
    const [usuarios, setUsuarios] = useState<UsuarioConMateria[]>(() =>
        JSON.parse(localStorage.getItem('usuarios') || '[]')
    );
    const [passwords, setPasswords] = useState<Record<string, string>>(() =>
        JSON.parse(localStorage.getItem('passwords') || '{}')
    );
    const [modalUserOpen, setModalUserOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UsuarioConMateria | null>(null);
    const [userForm, setUserForm] = useState({
        nombre: '',
        apellido: '',
        codigoUsuario: '',
        email: '',
        rol: 'ESTUDIANTE' as Role,
        materiaId: '',
    });
    const [userPass, setUserPass] = useState('');
    const [selectedMateria, setSelectedMateria] = useState('');
    const [userError, setUserError] = useState<string | null>(null);

    // Materias
    const [materias, setMaterias] = useState<Materia[]>(() =>
        JSON.parse(localStorage.getItem('materias') || '[]')
    );
    const [modalMatOpen, setModalMatOpen] = useState(false);
    const [editingMat, setEditingMat] = useState<Materia | null>(null);
    const [matForm, setMatForm] = useState({ nombre: '' });
    const [matError, setMatError] = useState<string | null>(null);

    // Persistencia en localStorage
    useEffect(() => {
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }, [usuarios]);
    useEffect(() => {
        localStorage.setItem('passwords', JSON.stringify(passwords));
    }, [passwords]);
    useEffect(() => {
        localStorage.setItem('materias', JSON.stringify(materias));
    }, [materias]);

    // Filtrado con búsqueda
    const filteredUsuarios = useMemo(() => {
        const term = searchUsuario.toLowerCase();
        return usuarios.filter(u => {
            const full = `${u.nombre} ${u.apellido}`.toLowerCase();
            const matName =
                materias.find(m => m.id === u.materiaId)?.nombre.toLowerCase() || '';
            return (
                full.includes(term) ||
                u.email.toLowerCase().includes(term) ||
                u.codigoUsuario.toLowerCase().includes(term) ||
                matName.includes(term)
            );
        });
    }, [searchUsuario, usuarios, materias]);

    const filteredMaterias = useMemo(() => {
        const term = searchMateria.toLowerCase();
        return materias.filter(m =>
            m.nombre.toLowerCase().includes(term)
        );
    }, [searchMateria, materias]);

    // Cálculo de páginas
    const userPageCount = Math.max(1, Math.ceil(filteredUsuarios.length / ITEMS_PER_PAGE));
    const matPageCount = Math.max(1, Math.ceil(filteredMaterias.length / ITEMS_PER_PAGE));

    const paginatedUsuarios = filteredUsuarios.slice(
        (userPage - 1) * ITEMS_PER_PAGE,
        userPage * ITEMS_PER_PAGE
    );
    const paginatedMaterias = filteredMaterias.slice(
        (matPage - 1) * ITEMS_PER_PAGE,
        matPage * ITEMS_PER_PAGE
    );

    // Abrir modales
    const openNewUser = () => {
        setEditingUser(null);
        setUserForm({ nombre: '', apellido: '', codigoUsuario: '', email: '', rol: 'ESTUDIANTE', materiaId: '' });
        setUserPass('');
        setSelectedMateria('');
        setUserError(null);
        setModalUserOpen(true);
    };
    const openEditUser = (u: UsuarioConMateria) => {
        setEditingUser(u);
        setUserForm({
            nombre: u.nombre,
            apellido: u.apellido,
            codigoUsuario: u.codigoUsuario,
            email: u.email,
            rol: u.rol,
            materiaId: u.materiaId || '',
        });
        setUserPass(passwords[u.email] || '');
        setSelectedMateria(u.materiaId || '');
        setUserError(null);
        setModalUserOpen(true);
    };

    // Guardar usuario con cierre inmediato del modal
    const handleSubmitUser = async () => {
        setUserError(null);
        const dup = usuarios.some(
            u =>
                !editingUser &&
                (u.email === userForm.email || u.codigoUsuario === userForm.codigoUsuario)
        );
        if (dup) {
            setUserError('Email o código ya registrado');
            return;
        }

        // Actualizo lista local
        if (editingUser) {
            setUsuarios(prev =>
                prev.map(u =>
                    u.id === editingUser.id
                        ? { ...u, ...userForm, materiaId: selectedMateria || undefined }
                        : u
                )
            );
        } else {
            const id = userForm.codigoUsuario.trim();
            const nuevo: UsuarioConMateria = {
                id,
                nombre: userForm.nombre,
                apellido: userForm.apellido,
                email: userForm.email,
                rol: userForm.rol,
                codigoUsuario: userForm.codigoUsuario,
                materiaId: selectedMateria || undefined,
            };
            setUsuarios(prev => [...prev, nuevo]);
        }

        // Cierro modal y limpio edición
        setModalUserOpen(false);
        setEditingUser(null);

        // Persiste contraseña
        setPasswords(p => ({ ...p, [userForm.email]: userPass }));

        // Asociar materia si aplica
        if (selectedMateria) {
            try {
                const targetId = editingUser ? editingUser.id : userForm.codigoUsuario.trim();
                await asociarUsuarioConMateria(targetId, selectedMateria);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleDeleteUser = (id: string) =>
        setUsuarios(prev => prev.filter(u => u.id !== id));

    // Materias: modales y guardado
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
    const handleSubmitMat = () => {
        setMatError(null);
        const dup = materias.some(
            x =>
                !editingMat &&
                x.nombre.trim().toLowerCase() === matForm.nombre.trim().toLowerCase()
        );
        if (dup) {
            setMatError('Materia duplicada');
            return;
        }
        if (editingMat) {
            setMaterias(prev =>
                prev.map(x =>
                    x.id === editingMat.id ? { ...x, nombre: matForm.nombre } : x
                )
            );
        } else {
            setMaterias(prev => [
                ...prev,
                { id: Date.now().toString(), nombre: matForm.nombre },
            ]);
        }
        setModalMatOpen(false);
    };
    const handleDeleteMat = (id: string) =>
        setMaterias(prev => prev.filter(m => m.id !== id));

    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-[#003c71]">Bienvenido, {user?.nombre}</h1>
            </header>

            {/* Usuarios */}
            <section className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#003c71]">Usuarios</h2>
                    <button onClick={openNewUser} className="flex items-center gap-2 bg-[#003c71] text-white px-4 py-2 rounded hover:bg-[#002f59]">
                        <UserPlus size={16} /> Nuevo usuario
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Buscar usuario..."
                    className="w-full border rounded px-3 py-2 mb-4"
                    value={searchUsuario}
                    onChange={e => { setSearchUsuario(e.target.value); setUserPage(1); }}
                />
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
                            {paginatedUsuarios.map(u => {
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
                                );
                            })}
                            {paginatedUsuarios.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-3 py-4 text-center text-gray-500">No se encontraron usuarios.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Paginación Usuarios */}
                <div className="flex justify-between items-center mt-4">
                    <span>Página {userPage} de {userPageCount}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setUserPage(p => Math.max(1, p - 1))}
                            disabled={userPage === 1}
                            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >Anterior</button>
                        <button
                            onClick={() => setUserPage(p => Math.min(userPageCount, p + 1))}
                            disabled={userPage === userPageCount}
                            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >Siguiente</button>
                    </div>
                </div>
            </section>

            {/* Materias */}
            <section className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[#003c71]">Materias</h2>
                    <button onClick={openNewMat} className="flex items-center gap-2 bg-[#003c71] text-white px-4 py-2 rounded hover:bg-[#002f59]">
                        <Plus size={16} /> Nueva materia
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Buscar materia..."
                    className="w-full border rounded px-3 py-2 mb-4"
                    value={searchMateria}
                    onChange={e => { setSearchMateria(e.target.value); setMatPage(1); }}
                />
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="px-3 py-2">Nombre</th>
                                <th className="px-3 py-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedMaterias.map(m => (
                                <tr key={m.id} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2">{m.nombre}</td>
                                    <td className="px-3 py-2 flex gap-2">
                                        <button onClick={() => openEditMat(m)} className="text-blue-600"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteMat(m.id)} className="text-red-600"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedMaterias.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-3 py-4 text-center text-gray-500">No se encontraron materias.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Paginación Materias */}
                <div className="flex justify-between items-center mt-4">
                    <span>Página {matPage} de {matPageCount}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMatPage(p => Math.max(1, p - 1))}
                            disabled={matPage === 1}
                            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >Anterior</button>
                        <button
                            onClick={() => setMatPage(p => Math.min(matPageCount, p + 1))}
                            disabled={matPage === matPageCount}
                            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >Siguiente</button>
                    </div>
                </div>
            </section>

            {/* Modal Usuario */}
            <Dialog open={modalUserOpen} onClose={() => setModalUserOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <Dialog.Title className="text-lg font-semibold mb-4">{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</Dialog.Title>
                    <form onSubmit={e => { e.preventDefault(); handleSubmitUser(); }} className="space-y-4">
                        <input type="text" placeholder="Nombre" required className="w-full border rounded px-3 py-2"
                            value={userForm.nombre} onChange={e => setUserForm({ ...userForm, nombre: e.target.value })} />
                        <input type="text" placeholder="Apellido" required className="w-full border rounded px-3 py-2"
                            value={userForm.apellido} onChange={e => setUserForm({ ...userForm, apellido: e.target.value })} />
                        <input type="text" placeholder="Código" required className="w-full border rounded px-3 py-2"
                            value={userForm.codigoUsuario}
                            onChange={e => {
                                const code = e.target.value;
                                setUserForm({ ...userForm, codigoUsuario: code, email: `${code}@uca.edu.sv` });
                            }} />
                        <input type="email" placeholder="Email" readOnly className="w-full border rounded px-3 py-2 bg-gray-100"
                            value={userForm.email} />
                        <input type="password" placeholder="Contraseña" required className="w-full border rounded px-3 py-2"
                            value={userPass} onChange={e => setUserPass(e.target.value)} />
                        <select value={userForm.rol} onChange={e => setUserForm({ ...userForm, rol: e.target.value as Role })}
                            className="w-full border rounded px-3 py-2">
                            <option value="INSTRUCTOR_SOCIAL">Instructor Social</option>
                            <option value="INSTRUCTOR_REMUNERADO">Instructor Remunerado</option>
                        </select>
                        <select value={selectedMateria} onChange={e => setSelectedMateria(e.target.value)}
                            className="w-full border rounded px-3 py-2" required={!editingUser}>
                            <option value="" disabled>Selecciona una materia</option>
                            {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                        {userError && <div className="text-red-600	text-sm">{userError}</div>}
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setModalUserOpen(false)} className="px-4 py-2 rounded	bg-gray-100 hover:bg-gray-200">Cancelar</button>
                            <button type="submit" className="px-4 py-2 rounded	bg-[#003c71] text-white hover:bg-[#002f59]">{editingUser ? 'Guardar' : 'Crear'}</button>
                        </div>
                    </form>
                </Dialog.Panel>
            </Dialog>

            {/* Modal Materia */}
            <Dialog open={modalMatOpen} onClose={() => setModalMatOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <Dialog.Title className="text-lg font-semibold mb-4">{editingMat ? 'Editar materia' : 'Nueva materia'}</Dialog.Title>
                    <form onSubmit={e => { e.preventDefault(); handleSubmitMat(); }} className="space-y-4">
                        <input type="text" placeholder="Nombre materia" required className="w-full border rounded px-3 py-2"
                            value={matForm.nombre} onChange={e => setMatForm({ nombre: e.target.value })} />
                        {matError && <div className="text-red-600	text-sm">{matError}</div>}
                        <div className="flex justify-end	gap-2">
                            <button type="button" onClick={() => setModalMatOpen(false)} className="px-4 py-2 rounded	bg-gray-100 hover:bg-gray-200">Cancelar</button>
                            <button type="submit" className="px-4 py-2 rounded	bg-[#003c71] text-white hover:bg-[#002f59]">{editingMat ? 'Guardar' : 'Crear'}</button>
                        </div>
                    </form>
                </Dialog.Panel>
            </Dialog>
        </div>
    );
};

export default DashboardEncargado;
