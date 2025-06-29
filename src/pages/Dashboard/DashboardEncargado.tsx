import React, {
    useState,
    useEffect,
    useMemo,
    FormEvent
} from 'react';
import {
    crearUsuario,
    listarUsuarios,
    actualizarUsuario,
    eliminarUsuario
} from '../../services/userService';
import {
    crearMateria,
    listarMaterias,
    actualizarMateria,
    eliminarMateria
} from '../../services/materiaService';
import type {
    UsuarioConMaterias,
    UsuarioDTO,
    Materia,
} from '../../types';
import { Plus, Trash2, Edit2, X } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const DashboardEncargado: React.FC = () => {
    // -- Estados para usuarios --
    const [searchUsuario, setSearchUsuario] = useState('');
    const [userPage, setUserPage] = useState(1);
    const [usuarios, setUsuarios] = useState<UsuarioConMaterias[]>([]);

    // -- Modal Usuario --
    const [modalUserOpen, setModalUserOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UsuarioConMaterias | null>(null);
    const [userForm, setUserForm] = useState<UsuarioDTO>({
        nombre: '',
        apellido: '',
        correo: '',
        contrasena: '',
        rol: 'ENCARGADO',
        codigoUsuario: ''
    });
    const [userError, setUserError] = useState<string | null>(null);

    // -- Estados para materias --
    const [searchMateria, setSearchMateria] = useState('');
    const [matPage, setMatPage] = useState(1);
    const [materias, setMaterias] = useState<Materia[]>([]);

    // -- Modal Materia --
    const [modalMatOpen, setModalMatOpen] = useState(false);
    const [editingMat, setEditingMat] = useState<Materia | null>(null);
    const [matForm, setMatForm] = useState<{ nombreMateria: string }>({ nombreMateria: '' });
    const [matError, setMatError] = useState<string | null>(null);

    // Carga inicial
    useEffect(() => {
        listarUsuarios()
            .then(res => {
                // materiaIds vacíos por defecto
                const data = res.data.map(u => ({ ...u, materiaIds: [] }));
                setUsuarios(data);
            })
            .catch(console.error);

        listarMaterias()
            .then(res => setMaterias(res.data))
            .catch(console.error);
    }, []);

    // Filtrado y paginación usuarios
    const filteredUsuarios = useMemo(() => {
        const term = searchUsuario.toLowerCase();
        return usuarios.filter(u =>
            (`${u.nombre} ${u.apellido}`.toLowerCase().includes(term)) ||
            u.correo.toLowerCase().includes(term) ||
            u.codigoUsuario.toLowerCase().includes(term)
        );
    }, [searchUsuario, usuarios]);
    const userPageCount = Math.max(1, Math.ceil(filteredUsuarios.length / ITEMS_PER_PAGE));
    const paginatedUsuarios = filteredUsuarios.slice((userPage - 1) * ITEMS_PER_PAGE, userPage * ITEMS_PER_PAGE);

    // Filtrado y paginación materias
    const filteredMaterias = useMemo(() => {
        const term = searchMateria.toLowerCase();
        return materias.filter(m => m.nombreMateria.toLowerCase().includes(term));
    }, [searchMateria, materias]);
    const matPageCount = Math.max(1, Math.ceil(filteredMaterias.length / ITEMS_PER_PAGE));
    const paginatedMaterias = filteredMaterias.slice((matPage - 1) * ITEMS_PER_PAGE, matPage * ITEMS_PER_PAGE);

    // Handlers Usuario
    const openNewUser = () => {
        setEditingUser(null);
        setUserForm({ nombre: '', apellido: '', correo: '', contrasena: '', rol: 'ENCARGADO', codigoUsuario: '' });
        setUserError(null);
        setModalUserOpen(true);
    };
    const openEditUser = (u: UsuarioConMaterias) => {
        setEditingUser(u);
        setUserForm({
            nombre: u.nombre,
            apellido: u.apellido,
            correo: u.correo,
            contrasena: '',
            rol: u.rol,
            codigoUsuario: u.codigoUsuario
        });
        setUserError(null);
        setModalUserOpen(true);
    };
    const handleSubmitUser = (e: FormEvent) => {
        e.preventDefault();
        setUserError(null);

        const dto: UsuarioDTO = { ...userForm };
        const action = editingUser
            ? actualizarUsuario(editingUser.idUsuario, dto)
            : crearUsuario(dto);

        action
            .then(res => {
                const updated = { ...(res.data as UsuarioConMaterias), materiaIds: editingUser ? editingUser.materiaIds : [] };
                setUsuarios(prev => editingUser
                    ? prev.map(u => u.idUsuario === updated.idUsuario ? updated : u)
                    : [...prev, updated]
                );
                setModalUserOpen(false);
            })
            .catch(err => setUserError(err.response?.data?.message || err.message));
    };
    const handleDeleteUser = (idUsuario: string) => {
        eliminarUsuario(idUsuario)
            .then(() => setUsuarios(prev => prev.filter(u => u.idUsuario !== idUsuario)))
            .catch(console.error);
    };

    // Handlers Materia
    const openNewMat = () => {
        setEditingMat(null);
        setMatForm({ nombreMateria: '' });
        setMatError(null);
        setModalMatOpen(true);
    };
    const openEditMat = (m: Materia) => {
        setEditingMat(m);
        setMatForm({ nombreMateria: m.nombreMateria });
        setMatError(null);
        setModalMatOpen(true);
    };
    const handleSubmitMat = (e: FormEvent) => {
        e.preventDefault();
        setMatError(null);

        const nombre = matForm.nombreMateria.trim();
        const action = editingMat
            // actualizarMateria(id: string, nombre: string)
            ? actualizarMateria(editingMat.idMateria, nombre)
            // crearMateria(nombre: string)
            : crearMateria(nombre);

        action
            .then(res => {
                const updated = res.data as Materia;
                setMaterias(prev => editingMat
                    ? prev.map(m => m.idMateria === updated.idMateria ? updated : m)
                    : [...prev, updated]
                );
                setModalMatOpen(false);
            })
            .catch(err => setMatError(err.response?.data?.message || err.message));
    };
    const handleDeleteMat = (id: string) => {
        eliminarMateria(id)
            .then(() => setMaterias(prev => prev.filter(m => m.idMateria !== id)))
            .catch(console.error);
    };

    return (
        <div className="space-y-8 p-4">
            {/* ===== Usuarios ===== */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-[#003c71]">Gestión de Usuarios</h2>
                    <button
                        onClick={openNewUser}
                        className="flex items-center gap-2 text-white bg-[#003c71] px-4 py-2 rounded hover:bg-[#002f59]"
                    >
                        <Plus size={16} /> Nuevo usuario
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Buscar usuario..."
                    className="border rounded px-3 py-2 w-full"
                    value={searchUsuario}
                    onChange={e => { setSearchUsuario(e.target.value); setUserPage(1); }}
                />
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
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
                            {paginatedUsuarios.map(u => (
                                <tr key={u.idUsuario} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2">{u.nombre} {u.apellido}</td>
                                    <td className="px-3 py-2">{u.correo}</td>
                                    <td className="px-3 py-2">{u.rol}</td>
                                    <td className="px-3 py-2">{u.codigoUsuario}</td>
                                    <td className="px-3 py-2 flex gap-2">
                                        <button onClick={() => openEditUser(u)} className="text-blue-600"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteUser(u.idUsuario)} className="text-red-600"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedUsuarios.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-4 text-center text-gray-500">
                                        No hay usuarios.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-between items-center mt-4">
                    <span>Página {userPage} de {userPageCount}</span>
                    <div className="flex gap-2">
                        <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1}>Anterior</button>
                        <button onClick={() => setUserPage(p => Math.min(userPageCount, p + 1))} disabled={userPage === userPageCount}>Siguiente</button>
                    </div>
                </div>
            </div>

            {/* ===== Materias ===== */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-[#003c71]">Gestión de Materias</h2>
                    <button
                        onClick={openNewMat}
                        className="flex items-center gap-2 text-white bg-[#003c71] px-4 py-2 rounded hover:bg-[#002f59]"
                    >
                        <Plus size={16} /> Nueva materia
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Buscar materia..."
                    className="border rounded px-3 py-2 w-full"
                    value={searchMateria}
                    onChange={e => { setSearchMateria(e.target.value); setMatPage(1); }}
                />
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="px-3 py-2">Nombre</th>
                                <th className="px-3 py-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedMaterias.map(m => (
                                <tr key={m.idMateria} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2">{m.nombreMateria}</td>
                                    <td className="px-3 py-2 flex gap-2">
                                        <button onClick={() => openEditMat(m)} className="text-blue-600"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteMat(m.idMateria)} className="text-red-600"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedMaterias.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="py-4 text-center text-gray-500">
                                        No hay materias.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-between items-center mt-4">
                    <span>Página {matPage} de {matPageCount}</span>
                    <div className="flex gap-2">
                        <button onClick={() => setMatPage(p => Math.max(1, p - 1))} disabled={matPage === 1}>Anterior</button>
                        <button onClick={() => setMatPage(p => Math.min(matPageCount, p + 1))} disabled={matPage === matPageCount}>Siguiente</button>
                    </div>
                </div>
            </div>

            {/* ===== Modal Usuario ===== */}
            {modalUserOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                        <button className="absolute top-3 right-3" onClick={() => setModalUserOpen(false)}><X /></button>
                        <h3 className="text-xl font-semibold mb-4">
                            {editingUser ? 'Editar usuario' : 'Nuevo usuario'}
                        </h3>
                        <form onSubmit={handleSubmitUser} className="space-y-3">
                            <input
                                type="text"
                                placeholder="Código de usuario"
                                value={userForm.codigoUsuario}
                                onChange={e => setUserForm(f => ({ ...f, codigoUsuario: e.target.value }))}
                                required
                                className="w-full border rounded px-3 py-2"
                            />
                            <input
                                type="text"
                                placeholder="Nombre"
                                value={userForm.nombre}
                                onChange={e => setUserForm(f => ({ ...f, nombre: e.target.value }))}
                                required
                                className="w-full border rounded px-3 py-2"
                            />
                            <input
                                type="text"
                                placeholder="Apellido"
                                value={userForm.apellido}
                                onChange={e => setUserForm(f => ({ ...f, apellido: e.target.value }))}
                                required
                                className="w-full border rounded px-3 py-2"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={userForm.correo}
                                onChange={e => setUserForm(f => ({ ...f, correo: e.target.value }))}
                                required
                                className="w-full border rounded px-3 py-2"
                            />
                            <select
                                value={userForm.rol}
                                onChange={e => setUserForm(f => ({ ...f, rol: e.target.value as any }))}
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="ENCARGADO">Encargado</option>
                                <option value="INSTRUCTOR_NORMAL">Instructor Social</option>
                                <option value="INSTRUCTOR_REMUNERADO">Instructor Remunerado</option>
                            </select>
                            {!editingUser && (
                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={userForm.contrasena}
                                    onChange={e => setUserForm(f => ({ ...f, contrasena: e.target.value }))}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            )}
                            {userError && <p className="text-red-600 text-sm">{userError}</p>}
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
                                Guardar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== Modal Materia ===== */}
            {modalMatOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm relative">
                        <button className="absolute top-3 right-3" onClick={() => setModalMatOpen(false)}><X /></button>
                        <h3 className="text-xl font-semibold mb-4">
                            {editingMat ? 'Editar materia' : 'Nueva materia'}
                        </h3>
                        <form onSubmit={handleSubmitMat} className="space-y-3">
                            <input
                                type="text"
                                placeholder="Nombre de la materia"
                                value={matForm.nombreMateria}
                                onChange={e => setMatForm(f => ({ nombreMateria: e.target.value }))}
                                required
                                className="w-full border rounded px-3 py-2"
                            />
                            {matError && <p className="text-red-600 text-sm">{matError}</p>}
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
                                Guardar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardEncargado;
