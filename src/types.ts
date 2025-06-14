
export type Role = 'ESTUDIANTE' | 'INSTRUCTOR_SOCIAL' | 'INSTRUCTOR_REMUNERADO' | 'ENCARGADO';

// Datos para crear o actualizar un usuario
export interface UsuarioDTO {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    rol: Role;
    codigoUsuario: string;
}

// Usuario retornado por la API
export interface Usuario {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: Role;
    codigoUsuario: string;
}

// DTO para el login
export interface UsuarioLoginDTO {
    email: string;
    password: string;
}

// Respuesta del login
export interface LoginResponse {
    token: string;
    usuario: Usuario;
}

// Datos para crear o actualizar una materia
export interface MateriaDTO {
    nombre: string;
}

// Materia retornada por la API
export interface Materia {
    id: string;
    nombre: string;
}

// Asociación Usuario-Materia
export interface UsuarioMateria {
    idUsuario: string;
    idMateria: string;
}

// Datos para crear o actualizar una actividad
export interface ActividadDTO {
    nombreActividad: string;
    tipo: 'SOCIAL' | 'REMUNERADA';
}

// Actividad retornada por la API
export interface Actividad {
    id: string;
    nombreActividad: string;
    tipo: 'SOCIAL' | 'REMUNERADA';
}

// Datos para crear un formulario de registro de horas
export interface FormularioDTO {
    idUsuario: string;
    semana: number;
    estado?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
}

// Formulario retornado por la API
export interface Formulario {
    id: string;
    idUsuario: string;
    fechaCreacion: string;
    semana: number;
    estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
}

// Datos para crear o actualizar un registro de hora
export interface RegistroDTO {
    idFormulario: string;
    idActividad: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
}

// Registro de hora retornado por la API
export interface RegistroHora {
    id: string;
    idFormulario: string;
    idActividad: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    horasEfectivas: number;
}

// Datos para crear o actualizar una validación de formulario
export interface ValidacionDTO {
    idFormulario: string;
    idEncargado: string;
    estado: 'APROBADO' | 'RECHAZADO';
    observacion?: string;
}

// Validación retornada por la API
export interface Validacion {
    id: string;
    idFormulario: string;
    idEncargado: string;
    fechaValidacion: string;
    estado: 'APROBADO' | 'RECHAZADO';
    observacion?: string;
}
