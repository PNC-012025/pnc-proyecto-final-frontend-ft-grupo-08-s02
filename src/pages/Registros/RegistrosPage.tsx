import React, { useEffect, useRef, useState, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { listarRegistrosPorUsuarioYFechas } from '../../services/registroHoraService';
import { listarMateriasPorUsuario } from '../../services/usuarioMateriaService';
import { listarMaterias } from '../../services/materiaService';
import { listarActividades } from '../../services/actividadService';
import type { RegistroHora, Materia, Actividad } from '../../types';

/* ───────── tipos ───────── */
interface PuenteLS { id_usuario: string; id_materia: string; }
interface CatMateria { id: string; nombre: string; }

const RegistrosPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.idUsuario ?? '';
  const userCode = user?.codigoUsuario ?? '';
  const canFilter = /(?:INSTRUCTOR_NORMAL|INSTRUCTOR_REMUNERADO)/i.test(user?.rol ?? '');

  /* materias y materia seleccionada */
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [materiaSel, setMateriaSel] = useState<string>('');

  /* registros históricos filtrados */
  const [registros, setRegistros] = useState<RegistroHora[]>([]);
  const [loading, setLoading] = useState(true);
  const [actividades, setActividades] = useState<Actividad[]>([]);

  const printableRef = useRef<HTMLDivElement>(null);

  // Datos fijos y rellenables
  const [info, setInfo] = useState({
    nombre: user?.nombre || '',
    carrera: 'Ingenieria Informatica',
    carnet: userCode,
    telefono: '',
    proyecto: '',
    institucion: '',
    inicio: '',
  });

  // Cargar materias asignadas al usuario
  const loadMaterias = useCallback(async () => {
    if (!canFilter) return;
    
    try {
      // Obtener todas las materias
      const todasLasMateriasRes = await listarMaterias();
      const todasLasMaterias = todasLasMateriasRes.data;
      
      // Obtener las materias asignadas al usuario
      const materiasUsuarioRes = await listarMateriasPorUsuario(String(userId));
      const materiasUsuario = materiasUsuarioRes.data;
      
      // Filtrar las materias que están asignadas al usuario
      const materiasAsignadas = todasLasMaterias.filter(materia => 
        materiasUsuario.some((m: any) => m.nombreMateria === materia.nombreMateria)
      );
      
      setMaterias(materiasAsignadas);
      if (materiasAsignadas.length > 0) {
        setMateriaSel(materiasAsignadas[0].idMateria);
      }
    } catch (error) {
      console.error('Error cargando materias:', error);
    }
  }, [canFilter, userId]);

  // Cargar registros históricos
  const loadRegistrosHistoricos = useCallback(async () => {
    setLoading(true);
    try {
      const [registrosRes, actividadesRes] = await Promise.all([
        listarRegistrosPorUsuarioYFechas(userId, '1900-01-01', '2099-12-31'),
        listarActividades()
      ]);

      const getValue = (val: any) => Array.isArray(val) ? val[0] : val;
      const registrosProcesados = registrosRes.data.map((registro: any) => {
        return {
          ...registro,
          idRegistro: getValue(registro.id_registro_hora) ?? getValue(registro.idRegistro),
          codigoUsuario: getValue(registro.codigo_usuario) ?? getValue(registro.codigoUsuario),
          fechaRegistro: getValue(registro.fecha_registro) ?? getValue(registro.fechaRegistro),
          horaInicio: getValue(registro.hora_inicio) ?? getValue(registro.horaInicio),
          horaFin: getValue(registro.hora_fin) ?? getValue(registro.horaFin),
          idActividad: getValue(registro.id_actividad) ?? getValue(registro.idActividad),
          idFormulario: getValue(registro.id_formulario) ?? getValue(registro.idFormulario),
          horasEfectivas: getValue(registro.horas_efectivas) ?? getValue(registro.horasEfectivas),
          estado: getValue(registro.estado) ?? 'PENDIENTE'
        };
      });

      // Filtrar solo registros históricos (APROBADO/RECHAZADO)
      const registrosHistoricos = registrosProcesados.filter(registro => 
        registro.estado === 'APROBADO' || registro.estado === 'RECHAZADO'
      );

      setRegistros(registrosHistoricos);
      setActividades(actividadesRes.data);
    } catch (error) {
      console.error('Error cargando registros históricos:', error);
      // Fallback a localStorage si la API falla
      const local = localStorage.getItem('registros');
      if (local) {
        const registrosLocal = JSON.parse(local);
        const registrosHistoricos = registrosLocal.filter((r: any) => 
          (r.estado === 'APROBADO' || r.estado === 'RECHAZADO') &&
          r.codigoUsuario === userCode
        );
        setRegistros(registrosHistoricos);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, userCode]);

  useEffect(() => {
    loadMaterias();
    loadRegistrosHistoricos();
  }, [loadMaterias, loadRegistrosHistoricos]);

  // Filtrar registros por materia seleccionada
  const registrosFiltrados = registros.filter(r => 
    !materiaSel || r.idFormulario === materiaSel
  );

  // Función helper para obtener el nombre de la actividad
  const getNombreActividad = (idActividad: string | number): string => {
    const id = typeof idActividad === 'string' ? idActividad : String(idActividad);
    const actividad = actividades.find(a => a.idActividad === id);
    return actividad ? actividad.nombreActividad : idActividad ? String(idActividad) : '—';
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  // Formatear hora
  const formatTime = (timeString: any) => {
    if (!timeString || typeof timeString !== 'string') return '--:--';
    return timeString.substring(0, 5); // Mostrar solo HH:MM
  };

  // Obtener color del estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'APROBADO':
        return 'bg-green-100 text-green-800';
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /* ── Generar PDF con márgenes y alta resolución ── */
  const downloadPdf = async () => {
    if (!printableRef.current) return;
    const canvas = await html2canvas(printableRef.current, { scale: 2 } as any);
    const pdf = new jsPDF('l', 'pt', 'a4');
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const usableWidth = pageWidth - margin * 2;
    const height = (canvas.height * usableWidth) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, usableWidth, height);
    pdf.save(`Registro_Asistencia_${info.carnet}_${Date.now()}.pdf`);
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6 max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold text-[#003c71]">Mis Registros Históricos</h1>
        </header>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando registros históricos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#003c71]">Mis Registros Históricos</h1>
        <div className="flex items-center gap-3">
          {canFilter && materias.length > 0 && (
            <select
              value={materiaSel}
              onChange={e => setMateriaSel(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 bg-white"
            >
              <option value="">Todas las Materias</option>
              {materias.map(m => (
                <option key={m.idMateria} value={m.idMateria}>{m.nombreMateria}</option>
              ))}
            </select>
          )}
          <button
            onClick={downloadPdf}
            className="bg-[#003c71] hover:bg-[#002f59] text-white px-4 py-2 rounded flex items-center shadow"
          >
            Descargar PDF
          </button>
        </div>
      </header>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total de Registros</h3>
          <p className="text-2xl font-bold text-gray-900">{registrosFiltrados.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Aprobados</h3>
          <p className="text-2xl font-bold text-green-600">
            {registrosFiltrados.filter(r => r.estado === 'APROBADO').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Rechazados</h3>
          <p className="text-2xl font-bold text-red-600">
            {registrosFiltrados.filter(r => r.estado === 'RECHAZADO').length}
          </p>
        </div>
      </div>

      {/* Formulario instructores */}
      {canFilter && (
        <section className="bg-white p-5 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold text-[#003c71]">Información para Control de Asistencia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ['Carrera',       info.carrera,      true],
              ['Carnet',        info.carnet,       true],
              ['Teléfono',      info.telefono,     false],
              ['Proyecto',      info.proyecto,     false],
              ['Responsable',   info.institucion,  false],
              ['Fecha inicio',  info.inicio,       false, 'date'],
            ].map(([label, val, ro, type], i) => (
              <div key={i} className="flex flex-col">
                <label className="text-sm font-medium">{label}</label>
                <input
                  type={(type as string) || 'text'}
                  value={val as string}
                  readOnly={ro as boolean}
                  onChange={e => {
                    const v = e.target.value;
                    const key = ((['carrera','carnet','telefono','proyecto','institucion','inicio'][i]) as keyof typeof info);
                    setInfo(info => ({ ...info, [key]: v }));
                  }}
                  className={`w-full border rounded px-3 py-2 ${
                    ro ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Zona imprimible */}
      <div
        ref={printableRef}
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      >
        {/* Datos del Estudiante */}
        <div className="bg-gray-100 px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p><strong>Nombre:</strong> {info.nombre}</p>
            <p><strong>Carrera:</strong> {info.carrera}</p>
            <p><strong>Carnet:</strong> {info.carnet}</p>
            <p><strong>Teléfono:</strong> {info.telefono || '-'}</p>
          </div>
          <div className="space-y-2">
            <p><strong>Proyecto:</strong> {info.proyecto || '-'}</p>
            <p><strong>Responsable:</strong> {info.institucion || '-'}</p>
            <p><strong>Fecha inicio:</strong> {info.inicio || '-'}</p>
            <p><strong>Materia:</strong> {materias.find(m => m.idMateria === materiaSel)?.nombreMateria || '—'}</p>
          </div>
        </div>

        {/* Tabla de Registros */}
        <div className="p-6 overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-white">
                {[
                  'Fecha',
                  'Hora inicio',
                  'Hora fin',
                  'Actividad',
                  'Aula',
                  'Horas efectivas',
                  'Estado',
                  'Firma Encargado'
                ].map(col => (
                  <th
                    key={col}
                    className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.length ? registrosFiltrados.map(r => (
                <tr key={r.idRegistro} className="bg-white hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 text-sm">{formatDate(r.fechaRegistro)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{formatTime(r.horaInicio)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{formatTime(r.horaFin)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{getNombreActividad(r.idActividad)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{r.aula}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{r.horasEfectivas}h</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(r.estado || 'PENDIENTE')}`}>
                      {r.estado || 'PENDIENTE'}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">________________</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="border border-gray-300 px-4 py-6 text-center text-gray-500">
                    No hay registros históricos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RegistrosPage;
