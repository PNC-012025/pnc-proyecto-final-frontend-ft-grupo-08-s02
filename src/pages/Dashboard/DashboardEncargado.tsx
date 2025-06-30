import React, { useState, useEffect, useMemo, FormEvent } from 'react';
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
import {
    asociarUsuarioConMateria,
    eliminarAsociacion,
    listarMateriasPorUsuario,
    listarUsuariosPorMateria
} from '../../services/usuarioMateriaService';
import type {
    UsuarioConMaterias,
    UsuarioDTO,
    Materia,
} from '../../types';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useAuth from '../../hooks/useAuth';

const ITEMS_PER_PAGE = 10;

const DashboardEncargado: React.FC = () => {
    const { user: currentUser, updateUser } = useAuth();
    const [searchUsuario, setSearchUsuario] = useState('');
    const [userPage, setUserPage] = useState(1);
    const [usuarios, setUsuarios] = useState<UsuarioConMaterias[]>([]);

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

    const [materiaSearch, setMateriaSearch] = useState('');
    const [selectedMaterias, setSelectedMaterias] = useState<string[]>([]);

    const [searchMateria, setSearchMateria] = useState('');
    const [matPage, setMatPage] = useState(1);
    const [materias, setMaterias] = useState<Materia[]>([]);

    const [modalMatOpen, setModalMatOpen] = useState(false);
    const [editingMat, setEditingMat] = useState<Materia | null>(null);
    const [matForm, setMatForm] = useState<{ nombreMateria: string }>({ nombreMateria: '' });
    const [matError, setMatError] = useState<string | null>(null);

    const filteredUsuarios = useMemo(() => {
        return usuarios.filter(u =>
            (`${u.nombre} ${u.apellido}`.toLowerCase().includes(searchUsuario.toLowerCase()))
        );
    }, [usuarios, searchUsuario]);

    const userPageCount = useMemo(() => {
        return Math.ceil(filteredUsuarios.length / ITEMS_PER_PAGE) || 1;
    }, [filteredUsuarios]);

    const paginatedUsuarios = useMemo(() => {
        const start = (userPage - 1) * ITEMS_PER_PAGE;
        return filteredUsuarios.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredUsuarios, userPage]);

    const filteredMaterias = useMemo(() => {
        return materias.filter(m =>
            m.nombreMateria.toLowerCase().includes(searchMateria.toLowerCase())
        );
    }, [materias, searchMateria]);

    const matPageCount = useMemo(() => {
        return Math.ceil(filteredMaterias.length / ITEMS_PER_PAGE) || 1;
    }, [filteredMaterias]);

    const paginatedMaterias = useMemo(() => {
        const start = (matPage - 1) * ITEMS_PER_PAGE;
        return filteredMaterias.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredMaterias, matPage]);

    const fetchUsuarios = async () => {
        try {
            const res = await listarUsuarios();
            const usuariosData = res.data;

            const usuariosConMaterias = await Promise.all(
                usuariosData.map(async (u) => {
                    try {
                        const materiasRes = await listarMateriasPorUsuario(String(u.idUsuario));
                        console.log(`Materias para usuario ${u.idUsuario}:`, materiasRes.data);
                        
                        // Extraer los nombres de las materias de la respuesta
                        const materiaNombres = materiasRes.data.map((m: any) => m.nombreMateria);
                        
                        return {
                            ...u,
                            materiaIds: materiaNombres // Ahora guardamos los nombres en lugar de IDs
                        } as UsuarioConMaterias;
                    } catch (error) {
                        console.error(`Error obteniendo materias para usuario ${u.idUsuario}:`, error);
                        return {
                            ...u,
                            materiaIds: []
                        } as UsuarioConMaterias;
                    }
                })
            );

            setUsuarios(usuariosConMaterias);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            toast.error('Error al cargar usuarios');
        }
    };

    const fetchMaterias = () => {
        listarMaterias()
            .then(res => setMaterias(res.data))
            .catch(() => toast.error('Error al cargar materias'));
    };

    useEffect(() => {
        fetchUsuarios();
        fetchMaterias();
    }, []);

    const handleMateriaCheckbox = (id: string) => {
        setSelectedMaterias(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const handleSubmitUser = async (e: FormEvent) => {
        e.preventDefault();
        setUserError(null);

        const isDuplicate = usuarios.some(u => u.codigoUsuario === userForm.codigoUsuario && (!editingUser || u.idUsuario !== editingUser.idUsuario));
        if (isDuplicate) {
            setUserError('Ya existe un usuario con ese código.');
            return;
        }

        const dto: UsuarioDTO = { ...userForm };
        try {
            const res = editingUser
                ? await actualizarUsuario(editingUser.idUsuario, dto)
                : await crearUsuario(dto);

            const usuarioId = res.data.idUsuario;

            if (editingUser) {
                const prev = await listarMateriasPorUsuario(String(editingUser.idUsuario));
                const prevNombres = prev.data.map((m: any) => m.nombreMateria);

                // Eliminar asociaciones que ya no están seleccionadas
                await Promise.all(
                    prevNombres
                        .filter((nombre: string) => !selectedMaterias.includes(nombre))
                        .map(nombre => {
                            // Buscar el idUsuarioXMateria para eliminar
                            const materiaToDelete = prev.data.find((m: any) => m.nombreMateria === nombre);
                            return materiaToDelete ? eliminarAsociacion(String(materiaToDelete.idUsuarioXMateria)) : Promise.resolve();
                        })
                );

                // Crear nuevas asociaciones solo para las materias que no existían previamente
                const materiasNuevas = selectedMaterias.filter(nombreMateria => !prevNombres.includes(nombreMateria));
                await Promise.all(
                    materiasNuevas.map((nombreMateria) => {
                        return asociarUsuarioConMateria(dto.codigoUsuario, nombreMateria);
                    })
                );
            } else {
                // Para usuarios nuevos, crear todas las asociaciones seleccionadas
                await Promise.all(
                    selectedMaterias.map((nombreMateria) => {
                        return asociarUsuarioConMateria(dto.codigoUsuario, nombreMateria);
                    })
                );
            }

            toast.success(editingUser ? 'Usuario actualizado con éxito' : 'Usuario creado exitosamente');
            
            // Si se está editando el usuario actual, actualizar el contexto
            if (editingUser && currentUser && editingUser.idUsuario === currentUser.idUsuario) {
                const updatedUser = {
                    ...currentUser,
                    nombre: dto.nombre,
                    apellido: dto.apellido,
                    correo: dto.correo,
                    rol: dto.rol,
                    codigoUsuario: dto.codigoUsuario
                };
                updateUser(updatedUser);
            }
            
            fetchUsuarios();
            setModalUserOpen(false);
        } catch (err: any) {
            toast.error('Error al guardar usuario');
            setUserError(err.response?.data?.message || err.message);
        }
    };

    const openNewUser = () => {
        setEditingUser(null);
        setUserForm({ nombre: '', apellido: '', correo: '', contrasena: '', rol: 'ENCARGADO', codigoUsuario: '' });
        setSelectedMaterias([]);
        setUserError(null);
        setModalUserOpen(true);
    };

    const openEditUser = async (u: UsuarioConMaterias) => {
        setEditingUser(u);
        setUserForm({
            nombre: u.nombre,
            apellido: u.apellido,
            correo: u.correo,
            contrasena: '',
            rol: u.rol,
            codigoUsuario: u.codigoUsuario,
        });

        try {
            const res = await listarMateriasPorUsuario(String(u.idUsuario));
            console.log('Materias del usuario para editar:', res.data);
            
            const materiaNombres = res.data.map((m: any) => m.nombreMateria);
            setSelectedMaterias(materiaNombres);
        } catch (error) {
            console.error('Error obteniendo materias para editar:', error);
            setSelectedMaterias([]);
        }

        setUserError(null);
        setModalUserOpen(true);
    };

    const handleDeleteUser = async (idUsuario: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        
        try {
            // Primero intentar eliminar directamente
            await eliminarUsuario(idUsuario);
            toast.success('Usuario eliminado correctamente');
            fetchUsuarios();
        } catch (error: any) {
            console.error('Error al eliminar usuario:', error);
            
            if (error.response?.status === 409) {
                // Si hay conflicto, preguntar si quiere desasignar todas las materias
                const confirmDesasignar = confirm(
                    'No se puede eliminar este usuario porque tiene materias asignadas. ¿Desea desasignar todas las materias y luego eliminar el usuario?'
                );
                
                if (confirmDesasignar) {
                    try {
                        // Obtener las materias asignadas
                        const materiasRes = await listarMateriasPorUsuario(idUsuario);
                        const materiasAsignadas = materiasRes.data;
                        
                        // Desasignar todas las materias
                        await Promise.all(
                            materiasAsignadas.map((materia: any) => 
                                eliminarAsociacion(String(materia.idUsuarioXMateria))
                            )
                        );
                        
                        // Ahora intentar eliminar el usuario
                        await eliminarUsuario(idUsuario);
                        toast.success('Usuario eliminado correctamente después de desasignar materias');
                        fetchUsuarios();
                    } catch (desasignarError: any) {
                        console.error('Error al desasignar materias:', desasignarError);
                        toast.error('Error al desasignar materias: ' + (desasignarError.response?.data?.message || desasignarError.message));
                    }
                }
            } else if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
            } else {
                toast.error('Error al eliminar usuario: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const handleSubmitMat = (e: FormEvent) => {
        e.preventDefault();
        setMatError(null);

        const nombre = matForm.nombreMateria.trim();
        const exists = materias.some(m => m.nombreMateria.toLowerCase() === nombre.toLowerCase() && (!editingMat || m.idMateria !== editingMat.idMateria));

        if (exists) {
            setMatError('Ya existe una materia con ese nombre.');
            return;
        }

        const action = editingMat ? actualizarMateria(editingMat.idMateria, nombre) : crearMateria(nombre);
        action
            .then(() => {
                toast.success(editingMat ? 'Materia actualizada con éxito' : 'Materia creada exitosamente');
                fetchMaterias();
                setModalMatOpen(false);
            })
            .catch(err => {
                toast.error('Error al guardar materia');
                setMatError(err.response?.data?.message || err.message);
            });
    };

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

    const handleDeleteMat = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta materia?')) return;
        
        try {
            // Primero intentar eliminar directamente
            await eliminarMateria(id);
            toast.success('Materia eliminada correctamente');
            fetchMaterias();
        } catch (error: any) {
            console.error('Error al eliminar materia:', error);
            
            if (error.response?.status === 409) {
                // Si hay conflicto, preguntar si quiere desasignar todos los usuarios
                const confirmDesasignar = confirm(
                    'No se puede eliminar esta materia porque tiene usuarios asignados. ¿Desea desasignar todos los usuarios y luego eliminar la materia?'
                );
                
                if (confirmDesasignar) {
                    try {
                        // Obtener los usuarios asignados a esta materia
                        const usuariosRes = await listarUsuariosPorMateria(id);
                        const usuariosAsignados = usuariosRes.data;
                        
                        // Para cada usuario, obtener sus materias y desasignar esta materia específica
                        await Promise.all(
                            usuariosAsignados.map(async (usuario: any) => {
                                const materiasRes = await listarMateriasPorUsuario(String(usuario.idUsuario));
                                const materiaToDelete = materiasRes.data.find((m: any) => 
                                    m.nombreMateria === materias.find(mat => String(mat.idMateria) === id)?.nombreMateria
                                );
                                if (materiaToDelete) {
                                    return eliminarAsociacion(String(materiaToDelete.idUsuarioXMateria));
                                }
                                return Promise.resolve();
                            })
                        );
                        
                        // Ahora intentar eliminar la materia
                        await eliminarMateria(id);
                        toast.success('Materia eliminada correctamente después de desasignar usuarios');
                        fetchMaterias();
                        fetchUsuarios(); // También refrescar usuarios
                    } catch (desasignarError: any) {
                        console.error('Error al desasignar usuarios:', desasignarError);
                        toast.error('Error al desasignar usuarios: ' + (desasignarError.response?.data?.message || desasignarError.message));
                    }
                }
            } else if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
            } else {
                toast.error('Error al eliminar materia: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    // Función para obtener los nombres de las materias de un usuario
    const getMateriasNombres = (usuario: UsuarioConMaterias): string => {
        if (!usuario.materiaIds || usuario.materiaIds.length === 0) {
            return 'Sin materias asignadas';
        }
        
        // Ahora materiaIds contiene los nombres directamente
        return usuario.materiaIds.join(', ');
    };

    return (
        <div className="space-y-8 p-4">
            {/* Gestión de Usuarios */}
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
                                <th className="px-3 py-2">Materias</th>
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
                                    <td className="px-3 py-2">
                                        {getMateriasNombres(u)}
                                    </td>
                                    <td className="px-3 py-2 flex gap-2">
                                        <button onClick={() => openEditUser(u)} className="text-blue-600"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteUser(String(u.idUsuario))} className="text-red-600"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedUsuarios.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-4 text-center text-gray-500">
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

            {/* Gestión de Materias */}
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
                                        <button onClick={() => handleDeleteMat(String(m.idMateria))} className="text-red-600"><Trash2 size={16} /></button>
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

            {modalUserOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                        <button className="absolute top-3 right-3" onClick={() => setModalUserOpen(false)}><X /></button>
                        <h3 className="text-xl font-semibold mb-4">{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</h3>
                        <form onSubmit={handleSubmitUser} className="space-y-3">
                            <input type="text" placeholder="Código de usuario" value={userForm.codigoUsuario} onChange={e => setUserForm(f => ({ ...f, codigoUsuario: e.target.value }))} required className="w-full border rounded px-3 py-2" />
                            <input type="text" placeholder="Nombre" value={userForm.nombre} onChange={e => setUserForm(f => ({ ...f, nombre: e.target.value }))} required className="w-full border rounded px-3 py-2" />
                            <input type="text" placeholder="Apellido" value={userForm.apellido} onChange={e => setUserForm(f => ({ ...f, apellido: e.target.value }))} required className="w-full border rounded px-3 py-2" />
                            <input type="email" placeholder="Email" value={userForm.correo} onChange={e => setUserForm(f => ({ ...f, correo: e.target.value }))} required className="w-full border rounded px-3 py-2" />
                            <select value={userForm.rol} onChange={e => setUserForm(f => ({ ...f, rol: e.target.value as any }))} className="w-full border rounded px-3 py-2">
                                <option value="ENCARGADO">Encargado</option>
                                <option value="INSTRUCTOR_NORMAL">Instructor Social</option>
                                <option value="INSTRUCTOR_REMUNERADO">Instructor Remunerado</option>
                            </select>
                            {!editingUser && (
                                <input type="password" placeholder="Contraseña" value={userForm.contrasena} onChange={e => setUserForm(f => ({ ...f, contrasena: e.target.value }))} required className="w-full border rounded px-3 py-2" />
                            )}
                            <input
                                type="text"
                                placeholder="Buscar materia..."
                                value={materiaSearch}
                                onChange={(e) => setMateriaSearch(e.target.value)}
                                className="w-full border rounded px-3 py-2 mt-4"
                            />
                            <div className="max-h-40 overflow-y-auto border rounded p-2">
                                {materias.filter((m) =>
                                    m.nombreMateria.toLowerCase().includes(materiaSearch.toLowerCase())
                                ).map((m) => (
                                    <label key={m.idMateria} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedMaterias.includes(m.nombreMateria)}
                                            value={m.nombreMateria}
                                            onChange={e => handleMateriaCheckbox(e.currentTarget.value)}
                                        />
                                        <span>{m.nombreMateria}</span>
                                    </label>
                                ))}
                            </div>
                            {userError && <p className="text-red-600 text-sm">{userError}</p>}
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Guardar</button>
                        </form>
                    </div>
                </div>
            )}

            {modalMatOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm relative">
                        <button className="absolute top-3 right-3" onClick={() => setModalMatOpen(false)}><X /></button>
                        <h3 className="text-xl font-semibold mb-4">{editingMat ? 'Editar materia' : 'Nueva materia'}</h3>
                        <form onSubmit={handleSubmitMat} className="space-y-3">
                            <input type="text" placeholder="Nombre de la materia" value={matForm.nombreMateria} onChange={e => setMatForm({ nombreMateria: e.target.value })} required className="w-full border rounded px-3 py-2" />
                            {matError && <p className="text-red-600 text-sm">{matError}</p>}
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Guardar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardEncargado;
