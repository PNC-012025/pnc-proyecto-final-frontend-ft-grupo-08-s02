import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { crearUsuario, listarUsuarios, actualizarUsuario, eliminarUsuario } from '../../services/userService';
import { crearMateria, listarMaterias, actualizarMateria, eliminarMateria } from '../../services/materiaService';
import { asociarUsuarioConMateria, eliminarAsociacion, listarMateriasPorUsuario, listarUsuariosPorMateria } from '../../services/usuarioMateriaService';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useAuth from '../../hooks/useAuth';
const ITEMS_PER_PAGE = 10;
const DashboardEncargado = () => {
    const { user: currentUser, updateUser } = useAuth();
    const [searchUsuario, setSearchUsuario] = useState('');
    const [userPage, setUserPage] = useState(1);
    const [usuarios, setUsuarios] = useState([]);
    const [modalUserOpen, setModalUserOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        nombre: '',
        apellido: '',
        correo: '',
        contrasena: '',
        rol: 'ENCARGADO',
        codigoUsuario: ''
    });
    const [userError, setUserError] = useState(null);
    const [materiaSearch, setMateriaSearch] = useState('');
    const [selectedMaterias, setSelectedMaterias] = useState([]);
    const [searchMateria, setSearchMateria] = useState('');
    const [matPage, setMatPage] = useState(1);
    const [materias, setMaterias] = useState([]);
    const [modalMatOpen, setModalMatOpen] = useState(false);
    const [editingMat, setEditingMat] = useState(null);
    const [matForm, setMatForm] = useState({ nombreMateria: '' });
    const [matError, setMatError] = useState(null);
    const filteredUsuarios = useMemo(() => {
        return usuarios.filter(u => (`${u.nombre} ${u.apellido}`.toLowerCase().includes(searchUsuario.toLowerCase())));
    }, [usuarios, searchUsuario]);
    const userPageCount = useMemo(() => {
        return Math.ceil(filteredUsuarios.length / ITEMS_PER_PAGE) || 1;
    }, [filteredUsuarios]);
    const paginatedUsuarios = useMemo(() => {
        const start = (userPage - 1) * ITEMS_PER_PAGE;
        return filteredUsuarios.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredUsuarios, userPage]);
    const filteredMaterias = useMemo(() => {
        return materias.filter(m => m.nombreMateria.toLowerCase().includes(searchMateria.toLowerCase()));
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
            const usuariosConMaterias = await Promise.all(usuariosData.map(async (u) => {
                try {
                    const materiasRes = await listarMateriasPorUsuario(String(u.idUsuario));
                    console.log(`Materias para usuario ${u.idUsuario}:`, materiasRes.data);
                    // Extraer los nombres de las materias de la respuesta
                    const materiaNombres = materiasRes.data.map((m) => m.nombreMateria);
                    return {
                        ...u,
                        materiaIds: materiaNombres // Ahora guardamos los nombres en lugar de IDs
                    };
                }
                catch (error) {
                    console.error(`Error obteniendo materias para usuario ${u.idUsuario}:`, error);
                    return {
                        ...u,
                        materiaIds: []
                    };
                }
            }));
            setUsuarios(usuariosConMaterias);
        }
        catch (error) {
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
    const handleMateriaCheckbox = (id) => {
        setSelectedMaterias(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };
    const handleSubmitUser = async (e) => {
        e.preventDefault();
        setUserError(null);
        const isDuplicate = usuarios.some(u => u.codigoUsuario === userForm.codigoUsuario && (!editingUser || u.idUsuario !== editingUser.idUsuario));
        if (isDuplicate) {
            setUserError('Ya existe un usuario con ese código.');
            return;
        }
        const dto = { ...userForm };
        try {
            const res = editingUser
                ? await actualizarUsuario(editingUser.idUsuario, dto)
                : await crearUsuario(dto);
            const usuarioId = res.data.idUsuario;
            if (editingUser) {
                const prev = await listarMateriasPorUsuario(String(editingUser.idUsuario));
                const prevNombres = prev.data.map((m) => m.nombreMateria);
                // Eliminar asociaciones que ya no están seleccionadas
                await Promise.all(prevNombres
                    .filter((nombre) => !selectedMaterias.includes(nombre))
                    .map(nombre => {
                    // Buscar el idUsuarioXMateria para eliminar
                    const materiaToDelete = prev.data.find((m) => m.nombreMateria === nombre);
                    return materiaToDelete ? eliminarAsociacion(String(materiaToDelete.idUsuarioXMateria)) : Promise.resolve();
                }));
                // Crear nuevas asociaciones solo para las materias que no existían previamente
                const materiasNuevas = selectedMaterias.filter(nombreMateria => !prevNombres.includes(nombreMateria));
                await Promise.all(materiasNuevas.map((nombreMateria) => {
                    return asociarUsuarioConMateria(dto.codigoUsuario, nombreMateria);
                }));
            }
            else {
                // Para usuarios nuevos, crear todas las asociaciones seleccionadas
                await Promise.all(selectedMaterias.map((nombreMateria) => {
                    return asociarUsuarioConMateria(dto.codigoUsuario, nombreMateria);
                }));
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
        }
        catch (err) {
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
    const openEditUser = async (u) => {
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
            const materiaNombres = res.data.map((m) => m.nombreMateria);
            setSelectedMaterias(materiaNombres);
        }
        catch (error) {
            console.error('Error obteniendo materias para editar:', error);
            setSelectedMaterias([]);
        }
        setUserError(null);
        setModalUserOpen(true);
    };
    const handleDeleteUser = async (idUsuario) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?'))
            return;
        try {
            // Primero intentar eliminar directamente
            await eliminarUsuario(idUsuario);
            toast.success('Usuario eliminado correctamente');
            fetchUsuarios();
        }
        catch (error) {
            console.error('Error al eliminar usuario:', error);
            if (error.response?.status === 409) {
                // Si hay conflicto, preguntar si quiere desasignar todas las materias
                const confirmDesasignar = confirm('No se puede eliminar este usuario porque tiene materias asignadas. ¿Desea desasignar todas las materias y luego eliminar el usuario?');
                if (confirmDesasignar) {
                    try {
                        // Obtener las materias asignadas
                        const materiasRes = await listarMateriasPorUsuario(idUsuario);
                        const materiasAsignadas = materiasRes.data;
                        // Desasignar todas las materias
                        await Promise.all(materiasAsignadas.map((materia) => eliminarAsociacion(String(materia.idUsuarioXMateria))));
                        // Ahora intentar eliminar el usuario
                        await eliminarUsuario(idUsuario);
                        toast.success('Usuario eliminado correctamente después de desasignar materias');
                        fetchUsuarios();
                    }
                    catch (desasignarError) {
                        console.error('Error al desasignar materias:', desasignarError);
                        toast.error('Error al desasignar materias: ' + (desasignarError.response?.data?.message || desasignarError.message));
                    }
                }
            }
            else if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
            }
            else {
                toast.error('Error al eliminar usuario: ' + (error.response?.data?.message || error.message));
            }
        }
    };
    const handleSubmitMat = (e) => {
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
    const openEditMat = (m) => {
        setEditingMat(m);
        setMatForm({ nombreMateria: m.nombreMateria });
        setMatError(null);
        setModalMatOpen(true);
    };
    const handleDeleteMat = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta materia?'))
            return;
        try {
            // Primero intentar eliminar directamente
            await eliminarMateria(id);
            toast.success('Materia eliminada correctamente');
            fetchMaterias();
        }
        catch (error) {
            console.error('Error al eliminar materia:', error);
            if (error.response?.status === 409) {
                // Si hay conflicto, preguntar si quiere desasignar todos los usuarios
                const confirmDesasignar = confirm('No se puede eliminar esta materia porque tiene usuarios asignados. ¿Desea desasignar todos los usuarios y luego eliminar la materia?');
                if (confirmDesasignar) {
                    try {
                        // Obtener los usuarios asignados a esta materia
                        const usuariosRes = await listarUsuariosPorMateria(id);
                        const usuariosAsignados = usuariosRes.data;
                        // Para cada usuario, obtener sus materias y desasignar esta materia específica
                        await Promise.all(usuariosAsignados.map(async (usuario) => {
                            const materiasRes = await listarMateriasPorUsuario(String(usuario.idUsuario));
                            const materiaToDelete = materiasRes.data.find((m) => m.nombreMateria === materias.find(mat => String(mat.idMateria) === id)?.nombreMateria);
                            if (materiaToDelete) {
                                return eliminarAsociacion(String(materiaToDelete.idUsuarioXMateria));
                            }
                            return Promise.resolve();
                        }));
                        // Ahora intentar eliminar la materia
                        await eliminarMateria(id);
                        toast.success('Materia eliminada correctamente después de desasignar usuarios');
                        fetchMaterias();
                        fetchUsuarios(); // También refrescar usuarios
                    }
                    catch (desasignarError) {
                        console.error('Error al desasignar usuarios:', desasignarError);
                        toast.error('Error al desasignar usuarios: ' + (desasignarError.response?.data?.message || desasignarError.message));
                    }
                }
            }
            else if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
            }
            else {
                toast.error('Error al eliminar materia: ' + (error.response?.data?.message || error.message));
            }
        }
    };
    // Función para obtener los nombres de las materias de un usuario
    const getMateriasNombres = (usuario) => {
        if (!usuario.materiaIds || usuario.materiaIds.length === 0) {
            return 'Sin materias asignadas';
        }
        // Ahora materiaIds contiene los nombres directamente
        return usuario.materiaIds.join(', ');
    };
    return (_jsxs("div", { className: "space-y-8 p-4", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6 space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-xl font-semibold text-[#003c71]", children: "Gesti\u00F3n de Usuarios" }), _jsxs("button", { onClick: openNewUser, className: "flex items-center gap-2 text-white bg-[#003c71] px-4 py-2 rounded hover:bg-[#002f59]", children: [_jsx(Plus, { size: 16 }), " Nuevo usuario"] })] }), _jsx("input", { type: "text", placeholder: "Buscar usuario...", className: "border rounded px-3 py-2 w-full", value: searchUsuario, onChange: e => { setSearchUsuario(e.target.value); setUserPage(1); } }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-100 text-gray-700", children: [_jsx("th", { className: "px-3 py-2", children: "Nombre" }), _jsx("th", { className: "px-3 py-2", children: "Email" }), _jsx("th", { className: "px-3 py-2", children: "Rol" }), _jsx("th", { className: "px-3 py-2", children: "C\u00F3digo" }), _jsx("th", { className: "px-3 py-2", children: "Materias" }), _jsx("th", { className: "px-3 py-2", children: "Acciones" })] }) }), _jsxs("tbody", { children: [paginatedUsuarios.map(u => (_jsxs("tr", { className: "border-b hover:bg-gray-50", children: [_jsxs("td", { className: "px-3 py-2", children: [u.nombre, " ", u.apellido] }), _jsx("td", { className: "px-3 py-2", children: u.correo }), _jsx("td", { className: "px-3 py-2", children: u.rol }), _jsx("td", { className: "px-3 py-2", children: u.codigoUsuario }), _jsx("td", { className: "px-3 py-2", children: getMateriasNombres(u) }), _jsxs("td", { className: "px-3 py-2 flex gap-2", children: [_jsx("button", { onClick: () => openEditUser(u), className: "text-blue-600", children: _jsx(Edit2, { size: 16 }) }), _jsx("button", { onClick: () => handleDeleteUser(String(u.idUsuario)), className: "text-red-600", children: _jsx(Trash2, { size: 16 }) })] })] }, u.idUsuario))), paginatedUsuarios.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "py-4 text-center text-gray-500", children: "No hay usuarios." }) }))] })] }) }), _jsxs("div", { className: "flex justify-between items-center mt-4", children: [_jsxs("span", { children: ["P\u00E1gina ", userPage, " de ", userPageCount] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setUserPage(p => Math.max(1, p - 1)), disabled: userPage === 1, children: "Anterior" }), _jsx("button", { onClick: () => setUserPage(p => Math.min(userPageCount, p + 1)), disabled: userPage === userPageCount, children: "Siguiente" })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6 space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-xl font-semibold text-[#003c71]", children: "Gesti\u00F3n de Materias" }), _jsxs("button", { onClick: openNewMat, className: "flex items-center gap-2 text-white bg-[#003c71] px-4 py-2 rounded hover:bg-[#002f59]", children: [_jsx(Plus, { size: 16 }), " Nueva materia"] })] }), _jsx("input", { type: "text", placeholder: "Buscar materia...", className: "border rounded px-3 py-2 w-full", value: searchMateria, onChange: e => { setSearchMateria(e.target.value); setMatPage(1); } }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-100 text-gray-700", children: [_jsx("th", { className: "px-3 py-2", children: "Nombre" }), _jsx("th", { className: "px-3 py-2", children: "Acciones" })] }) }), _jsxs("tbody", { children: [paginatedMaterias.map(m => (_jsxs("tr", { className: "border-b hover:bg-gray-50", children: [_jsx("td", { className: "px-3 py-2", children: m.nombreMateria }), _jsxs("td", { className: "px-3 py-2 flex gap-2", children: [_jsx("button", { onClick: () => openEditMat(m), className: "text-blue-600", children: _jsx(Edit2, { size: 16 }) }), _jsx("button", { onClick: () => handleDeleteMat(String(m.idMateria)), className: "text-red-600", children: _jsx(Trash2, { size: 16 }) })] })] }, m.idMateria))), paginatedMaterias.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 2, className: "py-4 text-center text-gray-500", children: "No hay materias." }) }))] })] }) }), _jsxs("div", { className: "flex justify-between items-center mt-4", children: [_jsxs("span", { children: ["P\u00E1gina ", matPage, " de ", matPageCount] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setMatPage(p => Math.max(1, p - 1)), disabled: matPage === 1, children: "Anterior" }), _jsx("button", { onClick: () => setMatPage(p => Math.min(matPageCount, p + 1)), disabled: matPage === matPageCount, children: "Siguiente" })] })] })] }), modalUserOpen && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center", children: _jsxs("div", { className: "bg-white rounded-lg p-6 w-full max-w-md relative", children: [_jsx("button", { className: "absolute top-3 right-3", onClick: () => setModalUserOpen(false), children: _jsx(X, {}) }), _jsx("h3", { className: "text-xl font-semibold mb-4", children: editingUser ? 'Editar usuario' : 'Nuevo usuario' }), _jsxs("form", { onSubmit: handleSubmitUser, className: "space-y-3", children: [_jsx("input", { type: "text", placeholder: "C\u00F3digo de usuario", value: userForm.codigoUsuario, onChange: e => setUserForm(f => ({ ...f, codigoUsuario: e.target.value })), required: true, className: "w-full border rounded px-3 py-2" }), _jsx("input", { type: "text", placeholder: "Nombre", value: userForm.nombre, onChange: e => setUserForm(f => ({ ...f, nombre: e.target.value })), required: true, className: "w-full border rounded px-3 py-2" }), _jsx("input", { type: "text", placeholder: "Apellido", value: userForm.apellido, onChange: e => setUserForm(f => ({ ...f, apellido: e.target.value })), required: true, className: "w-full border rounded px-3 py-2" }), _jsx("input", { type: "email", placeholder: "Email", value: userForm.correo, onChange: e => setUserForm(f => ({ ...f, correo: e.target.value })), required: true, className: "w-full border rounded px-3 py-2" }), _jsxs("select", { value: userForm.rol, onChange: e => setUserForm(f => ({ ...f, rol: e.target.value })), className: "w-full border rounded px-3 py-2", children: [_jsx("option", { value: "ENCARGADO", children: "Encargado" }), _jsx("option", { value: "INSTRUCTOR_NORMAL", children: "Instructor Social" }), _jsx("option", { value: "INSTRUCTOR_REMUNERADO", children: "Instructor Remunerado" })] }), !editingUser && (_jsx("input", { type: "password", placeholder: "Contrase\u00F1a", value: userForm.contrasena, onChange: e => setUserForm(f => ({ ...f, contrasena: e.target.value })), required: true, className: "w-full border rounded px-3 py-2" })), _jsx("input", { type: "text", placeholder: "Buscar materia...", value: materiaSearch, onChange: (e) => setMateriaSearch(e.target.value), className: "w-full border rounded px-3 py-2 mt-4" }), _jsx("div", { className: "max-h-40 overflow-y-auto border rounded p-2", children: materias.filter((m) => m.nombreMateria.toLowerCase().includes(materiaSearch.toLowerCase())).map((m) => (_jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: selectedMaterias.includes(m.nombreMateria), value: m.nombreMateria, onChange: e => handleMateriaCheckbox(e.currentTarget.value) }), _jsx("span", { children: m.nombreMateria })] }, m.idMateria))) }), userError && _jsx("p", { className: "text-red-600 text-sm", children: userError }), _jsx("button", { type: "submit", className: "w-full bg-blue-600 text-white py-2 rounded", children: "Guardar" })] })] }) })), modalMatOpen && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center", children: _jsxs("div", { className: "bg-white rounded-lg p-6 w-full max-w-sm relative", children: [_jsx("button", { className: "absolute top-3 right-3", onClick: () => setModalMatOpen(false), children: _jsx(X, {}) }), _jsx("h3", { className: "text-xl font-semibold mb-4", children: editingMat ? 'Editar materia' : 'Nueva materia' }), _jsxs("form", { onSubmit: handleSubmitMat, className: "space-y-3", children: [_jsx("input", { type: "text", placeholder: "Nombre de la materia", value: matForm.nombreMateria, onChange: e => setMatForm({ nombreMateria: e.target.value }), required: true, className: "w-full border rounded px-3 py-2" }), matError && _jsx("p", { className: "text-red-600 text-sm", children: matError }), _jsx("button", { type: "submit", className: "w-full bg-blue-600 text-white py-2 rounded", children: "Guardar" })] })] }) }))] }));
};
export default DashboardEncargado;
