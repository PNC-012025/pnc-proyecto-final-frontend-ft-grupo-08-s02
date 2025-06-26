import React, { useState, useEffect, useMemo } from 'react';
import { Plus, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import useAuth from '../../hooks/useAuth';
import type { Usuario, Role, Materia } from '../../types';

type UsuarioConMaterias = Usuario & { materiaIds: string[] };
interface PuenteLS { id_usuario: string; id_materia: string; }

const ITEMS_PER_PAGE = 10;

const DashboardEncargado: React.FC = () => {
    const { user, logout } = useAuth();

    // Estados de búsqueda y paginación
    const [searchUsuario, setSearchUsuario] = useState('');
    const [searchMateria, setSearchMateria] = useState('');
    const [searchMateriaModal, setSearchMateriaModal] = useState('');
    const [userPage, setUserPage] = useState(1);
    const [matPage, setMatPage] = useState(1);

    // Usuarios
    const [usuarios, setUsuarios] = useState<UsuarioConMaterias[]>(() =>
        (JSON.parse(localStorage.getItem('usuarios') || '[]') as any[]).map(u => ({
            ...u,
            materiaIds: u.materiaIds || []
        }))
    );
    const [passwords, setPasswords] = useState<Record<string, string>>(() =>
        JSON.parse(localStorage.getItem('passwords') || '{}')
    );

    // Modal Usuario
    const [modalUserOpen, setModalUserOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UsuarioConMaterias | null>(null);
    const [userForm, setUserForm] = useState({
        nombre: '',
        apellido: '',
        codigoUsuario: '',
        email: '',
        rol: 'INSTRUCTOR_SOCIAL' as Role,
        materiaIds: [] as string[]
    });
    const [userPass, setUserPass] = useState('');
    const [userError, setUserError] = useState<string | null>(null);

    // Materias globales
    const [materias, setMaterias] = useState<Materia[]>(() =>
        JSON.parse(localStorage.getItem('materias') || '[]')
    );

    // Modal Materia
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

    // Filtrado de listas: Usuarios y Materias
    const filteredUsuarios = useMemo(() => {
        const term = searchUsuario.toLowerCase();
        return usuarios.filter(u => {
            const fullName = `${u.nombre} ${u.apellido}`.toLowerCase();
            const matNames = u.materiaIds
                .map(id => materias.find(m => m.id === id)?.nombre || '')
                .join(' ')
                .toLowerCase();
            return (
                fullName.includes(term) ||
                u.email.toLowerCase().includes(term) ||
                u.codigoUsuario.toLowerCase().includes(term) ||
                matNames.includes(term)
            );
        });
    }, [searchUsuario, usuarios, materias]);

    const filteredMaterias = useMemo(() => {
        const term = searchMateria.toLowerCase();
        return materias.filter(m => m.nombre.toLowerCase().includes(term));
    }, [searchMateria, materias]);

    const filteredModalMaterias = useMemo(() => {
        const term = searchMateriaModal.toLowerCase();
        return materias.filter(m => m.nombre.toLowerCase().includes(term));
    }, [searchMateriaModal, materias]);

    // Paginación
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

    // Funciones para Usuarios
    const openNewUser = () => {
        setEditingUser(null);
        setUserForm({
            nombre: '',
            apellido: '',
            codigoUsuario: '',
            email: '',
            rol: 'INSTRUCTOR_SOCIAL',
            materiaIds: []
        });
        setUserPass('');
        setUserError(null);
        setSearchMateriaModal('');
        setModalUserOpen(true);
    };

    const openEditUser = (u: UsuarioConMaterias) => {
        setEditingUser(u);
        // Cargar materias asignadas desde localStorage
        const puenteRaw = localStorage.getItem('usuarioXmateria') || '[]';
        const puente = JSON.parse(puenteRaw) as PuenteLS[];
        const assigned = puente
            .filter(p => p.id_usuario === u.codigoUsuario)
            .map(p => p.id_materia);
        setUserForm({
            nombre: u.nombre,
            apellido: u.apellido,
            codigoUsuario: u.codigoUsuario,
            email: u.email,
            rol: u.rol,
            materiaIds: assigned
        });
        setUserPass(passwords[u.email] || '');
        setUserError(null);
        setSearchMateriaModal('');
        setModalUserOpen(true);
    };

    const handleSubmitUser = () => {
        setUserError(null);
        const dup = usuarios.some(u =>
            !editingUser &&
            (u.email === userForm.email || u.codigoUsuario === userForm.codigoUsuario)
        );
        if (dup) {
            setUserError('Email o código ya registrado');
            return;
        }

        let updatedUsers: UsuarioConMaterias[];
        if (editingUser) {
            updatedUsers = usuarios.map(u =>
                u.codigoUsuario === editingUser.codigoUsuario ? { ...u, ...userForm } : u
            );
        } else {
            const newUser = { ...userForm, id: userForm.codigoUsuario };
            updatedUsers = [...usuarios, newUser];
            setPasswords(p => ({ ...p, [userForm.email]: userPass }));
        }

        // Persistir relación usuario↔materia en LS
        const rawP = localStorage.getItem('usuarioXmateria') || '[]';
        let puente = JSON.parse(rawP) as PuenteLS[];
        // Eliminar asignaciones previas para este usuario
        puente = puente.filter(p => p.id_usuario !== userForm.codigoUsuario);
        // Añadir nuevas asignaciones
        userForm.materiaIds.forEach(mid =>
            puente.push({ id_usuario: userForm.codigoUsuario, id_materia: mid })
        );
        localStorage.setItem('usuarioXmateria', JSON.stringify(puente));
        // Disparar evento para que DashboardEstudiante recargue materias
        window.dispatchEvent(new Event('usuarioXmateriaChanged'));

        setUsuarios(updatedUsers);
        setModalUserOpen(false);
    };

    const handleDeleteUser = (id: string) =>
        setUsuarios(prev => prev.filter(u => u.id !== id));

    // Funciones para Materias
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
        const dup = materias.some(
            x => !editingMat && x.nombre.trim().toLowerCase() === matForm.nombre.trim().toLowerCase()
        );
        if (dup) {
            setMatError('Materia duplicada');
            return;
        }
        if (editingMat) {
            setMaterias(prev =>
                prev.map(x => (x.id === editingMat.id ? { ...x, nombre: matForm.nombre } : x))
            );
        } else {
            setMaterias(prev => [...prev, { id: Date.now().toString(), nombre: matForm.nombre }]);
        }
        setModalMatOpen(false);
    };
    const handleDeleteMat = (id: string) =>
        setMaterias(prev => prev.filter(m => m.id !== id));

    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-[rgb(0,60,113)]">
                    Panel administrativo
                </h1>
            </header>

            {/* Sección Usuarios */}
            <section className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[rgb(0,60,113)]">
                        Usuarios
                    </h2>
                    <button
                        onClick={openNewUser}
                        className="flex items-center gap-2 bg-[rgb(0,60,113)] text-white px-4 py-2 rounded hover:bg-[rgb(0,50,95)]"
                    >
                        <UserPlus size={16} /> Nuevo usuario
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Buscar usuario..."
                    className="w-full border rounded px-3 py-2 mb-4"
                    value={searchUsuario}
                    onChange={e => {
                        setSearchUsuario(e.target.value);
                        setUserPage(1);
                    }}
                />
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="px-3 py-2">Nombre</th>
                                <th className="px-3 py-2">Email</th>
                                <th className="px-3 py-2">Rol</th>
                                <th className="px-3 py-2">Código</th>
                                <th className="px-3 py-2">Materias</th>
                                <th className="px-3 py-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsuarios.map(u => (
                                <tr key={u.codigoUsuario} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2">{u.nombre} {u.apellido}</td>
                                    <td className="px-3 py-2">{u.email}</td>
                                    <td className="px-3 py-2">{u.rol}</td>
                                    <td className="px-3 py-2">{u.codigoUsuario}</td>
                                    <td className="px-3 py-2">
                                        {u.materiaIds
                                            .map(id => materias.find(m => m.id === id)?.nombre)
                                            .join(', ')}
                                    </td>
                                    <td className="px-3 py-2 flex gap-2">
                                        <button onClick={() => openEditUser(u)} className="text-blue-600">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-600">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedUsuarios.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                                        No se encontraron usuarios.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-between items-center mt-4">
                    <span>
                        Página {userPage} de {userPageCount}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setUserPage(p => Math.max(1, p - 1))}
                            disabled={userPage === 1}
                            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setUserPage(p => Math.min(userPageCount, p + 1))}
                            disabled={userPage === userPageCount}
                            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </section>

            {/* Sección Materias */}
            <section className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[rgb(0,60,113)]">
                        Materias
                    </h2>
                    <button
                        onClick={openNewMat}
                        className="flex items-center gap-2 bg-[rgb(0,60,113)] text-white px-4 py-2 rounded hover:bg-[rgb(0,50,95)]"
                    >
                        <Plus size={16} /> Nueva materia
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Buscar materia..."
                    className="w-full border rounded px-3 py-2 mb-4"
                    value={searchMateria}
                    onChange={e => {
                        setSearchMateria(e.target.value);
                        setMatPage(1);
                    }}
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
                                        <button onClick={() => openEditMat(m)} className="text-blue-600">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteMat(m.id)} className="text-red-600">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedMaterias.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-3 py-4 text-center text-gray-500">
                                        No se encontraron materias.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-between items-center mt-4">
                    <span>
                        Página {matPage} de {matPageCount}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMatPage(p => Math.max(1, p - 1))}
                            disabled={matPage === 1}
                            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setMatPage(p => Math.min(matPageCount, p + 1))}
                            disabled={matPage === matPageCount}
                            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </section>

            {/* Modal Usuario */}
            <Dialog
                open={modalUserOpen}
                onClose={() => setModalUserOpen(false)}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <Dialog.Title className="text-lg font-semibold mb-4">
                        {editingUser ? 'Editar usuario' : 'Nuevo usuario'}
                    </Dialog.Title>
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            handleSubmitUser();
                        }}
                        className="space-y-4"
                    >
                        <input
                            type="text"
                            required
                            placeholder="Nombre"
                            className="w-full border rounded px-3 py-2"
                            value={userForm.nombre}
                            onChange={e =>
                                setUserForm(prev => ({ ...prev, nombre: e.target.value }))
                            }
                        />
                        <input
                            type="text"
                            required
                            placeholder="Apellido"
                            className="w-full border rounded px-3 py-2"
                            value={userForm.apellido}
                            onChange={e =>
                                setUserForm(prev => ({ ...prev, apellido: e.target.value }))
                            }
                        />
                        <input
                            type="text"
                            required
                            placeholder="Código"
                            className="w-full border rounded px-3 py-2"
                            value={userForm.codigoUsuario}
                            onChange={e => {
                                const code = e.target.value;
                                setUserForm(prev => ({
                                    ...prev,
                                    codigoUsuario: code,
                                    email: `${code}@uca.edu.sv`
                                }));
                            }}
                        />
                        <input
                            type="email"
                            readOnly
                            placeholder="Email"
                            className="w-full border rounded px-3 py-2 bg-gray-100"
                            value={userForm.email}
                        />
                        <input
                            type="password"
                            required
                            placeholder="Contraseña"
                            className="w-full border rounded px-3 py-2"
                            value={userPass}
                            onChange={e => setUserPass(e.target.value)}
                        />

                        <select
                            className="w-full border rounded px-3 py-2"
                            value={userForm.rol}
                            onChange={e =>
                                setUserForm(prev => ({
                                    ...prev,
                                    rol: e.target.value as Role
                                }))
                            }
                        >
                            <option value="INSTRUCTOR_SOCIAL">Instructor Social</option>
                            <option value="INSTRUCTOR_REMUNERADO">Instructor Remunerado</option>
                        </select>

                        <label className="block text-sm font-medium">Buscar materia</label>
                        <input
                            type="text"
                            placeholder="Buscar materia..."
                            className="w-full border rounded px-3 py-2 mb-2"
                            value={searchMateriaModal}
                            onChange={e => setSearchMateriaModal(e.target.value)}
                        />
                        <label className="block text-sm font-medium">Materias</label>
                        <div className="border rounded max-h-48 overflow-auto p-2">
                            {filteredModalMaterias.map(m => (
                                <label key={m.id} className="flex items-center mb-2">
                                    <input
                                        type="checkbox"
                                        value={m.id}
                                        checked={userForm.materiaIds.includes(m.id)}
                                        onChange={e => {
                                            const { checked, value } = e.target;
                                            setUserForm(prev => ({
                                                ...prev,
                                                materiaIds: checked
                                                    ? [...prev.materiaIds, value]
                                                    : prev.materiaIds.filter(id => id !== value)
                                            }));
                                        }}
                                        className="h-4 w-4 text-blue-600"
                                    />
                                    <span className="ml-2 text-gray-700">{m.nombre}</span>
                                </label>
                            ))}
                        </div>
                        {userError && (
                            <div className="text-red-600 text-sm">{userError}</div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setModalUserOpen(false)}
                                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded bg-[rgb(0,60,113)] text-white hover:bg-[rgb(0,50,95)]"
                            >
                                {editingUser ? 'Guardar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </Dialog>

            {/* Modal Materia */}
            <Dialog
                open={modalMatOpen}
                onClose={() => setModalMatOpen(false)}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <Dialog.Title className="text-lg font-semibold mb-4">
                        {editingMat ? 'Editar materia' : 'Nueva materia'}
                    </Dialog.Title>
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            handleSubmitMat();
                        }}
                        className="space-y-4"
                    >
                        <input
                            type="text"
                            required
                            placeholder="Nombre materia"
                            className="w-full border rounded px-3 py-2"
                            value={matForm.nombre}
                            onChange={e => setMatForm({ nombre: e.target.value })}
                        />
                        {matError && <div className="text-red-600 text-sm">{matError}</div>}
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setModalMatOpen(false)}
                                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded bg-[rgb(0,60,113)] text-white hover:bg-[rgb(0,50,95)]"
                            >
                                {editingMat ? 'Guardar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </Dialog>
        </div>
    );
};

export default DashboardEncargado;
