import React, { useEffect, useRef, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ───────── tipos ───────── */
interface RegistroHora {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  actividad: string;
  aula: string;
  horasEfectivas: number;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  estudianteId: string;
  materia?: string;
}
interface PuenteLS { id_usuario: string; id_materia: string; }
interface CatMateria { id: string; nombre: string; }

const RegistrosPage: React.FC = () => {
  const { user } = useAuth();
  const userId = (user as any)?.codigoUsuario ?? user?.id ?? '';
  const canFilter = /(?:INSTRUCTOR_SOCIAL|INSTRUCTOR_REMUNERADO)/i.test(user?.rol ?? '');

  /* materias y materia seleccionada */
  const [materias, setMaterias] = useState<CatMateria[]>([]);
  const [materiaSel, setMateriaSel] = useState<string>('');

  /* registros aprobados filtrados */
  const [registros, setRegistros] = useState<RegistroHora[]>([]);

  const printableRef = useRef<HTMLDivElement>(null);

  // Datos fijos y rellenables
  const [info, setInfo] = useState({
    nombre: user?.nombre || '',
    carrera: 'Ingenieria Informatica',
    carnet: userId,
    telefono: '',
    proyecto: '',
    institucion: '',
    inicio: '',
  });

  /* ── Se obtienen materias ── */
  useEffect(() => {
    if (!canFilter) return;
    const rawP = localStorage.getItem('usuarioXmateria');
    const rawM = localStorage.getItem('materias');
    if (!rawP || !rawM) return;
    const puente = JSON.parse(rawP) as PuenteLS[];
    const catalog = JSON.parse(rawM) as CatMateria[];
    const ids = puente.filter(p => p.id_usuario === userId).map(p => p.id_materia);
    setMaterias(catalog.filter(m => ids.includes(m.id)));
    setMateriaSel(ids[0] || '');
  }, [canFilter, userId]);

  /* ── Se cargan de registros ── */
  useEffect(() => {
    const raw = localStorage.getItem('registros');
    if (!raw) { setRegistros([]); return; }
    const all = JSON.parse(raw) as RegistroHora[];
    setRegistros(all.filter(r =>
      r.estudianteId === userId &&
      r.estado === 'APROBADO' &&
      (!materiaSel || r.materia === materiaSel)
    ));
  }, [userId, materiaSel]);

  /* ── Generacion de PDF ── */
  const downloadPdf = async () => {
    if (!printableRef.current) return;
    const canvas = await html2canvas(printableRef.current, { scale: 2 } as any);
    const pdf = new jsPDF('l', 'pt', 'a4');
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const usableWidth = pageWidth - margin * 2;
    const height = (canvas.height * usableWidth) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, usableWidth, height);
    const slug = (materiaSel || 'general').replace(/\s+/g, '_');
    pdf.save(`Registro de asistencia_${info.carnet}_.pdf`);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Encabezado y filtro */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-[rgb(0,60,113)]">Mis registros aprobados</h2>
        {canFilter && (
          <select
            value={materiaSel}
            onChange={e => setMateriaSel(e.target.value)}
            className="border px-2 py-1 rounded bg-white"
          >
            <option value="">Todas las materias</option>
            {materias.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        )}
        <button
          onClick={downloadPdf}
          className="flex items-center gap-1 bg-[rgb(0,60,113)] text-white px-4 py-2 rounded hover:bg-[rgb(0,50,95)]"
        >
          Descargar PDF
        </button>
      </div>

      {/* Formulario para instructores */}
      {canFilter && (
        <div className="bg-white p-4 rounded shadow space-y-4">
          <h3 className="text-lg font-semibold text-[rgb(0,60,113)]">
            Información para Control de Asistencia
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Carrera', value: info.carrera, readOnly: true },
              { label: 'Carnet', value: info.carnet, readOnly: true },
              { label: 'Teléfono', value: info.telefono, onChange: (v: string) => setInfo(i => ({ ...i, telefono: v })) },
              { label: 'Nombre Proyecto', value: info.proyecto, onChange: (v: string) => setInfo(i => ({ ...i, proyecto: v })) },
              { label: 'Responsable', value: info.institucion, onChange: (v: string) => setInfo(i => ({ ...i, institucion: v })) },
              { label: 'Fecha inicio', value: info.inicio, type: 'date', onChange: (v: string) => setInfo(i => ({ ...i, inicio: v })) },
            ].map(({ label, value, readOnly, onChange, type }) => (
              <div key={label} className="flex flex-col">
                <label className="text-sm font-medium">{label}</label>
                <input
                  type={type || 'text'}
                  value={value}
                  readOnly={!!readOnly}
                  onChange={e => onChange && onChange(e.target.value)}
                  className={`w-full border rounded px-3 py-2 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zona imprimible para PDF */}
      <div
        ref={printableRef}
        className="mx-auto bg-white rounded-lg shadow-lg border border-gray-300 overflow-hidden"
        style={{ width: '90%', paddingBottom: '20px' }}
      >
        {/* Header gris con datos */}
        <div className="bg-gray-100 px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <p><strong>Nombre:</strong> {info.nombre}</p>
            <p><strong>Carrera:</strong> {info.carrera}</p>
            <p><strong>Carnet:</strong> {info.carnet}</p>
            <p><strong>Teléfono:</strong> {info.telefono || '-'}</p>
          </div>
          <div className="space-y-1">
            <p><strong>Proyecto:</strong> {info.proyecto || '-'}</p>
            <p><strong>Responsable:</strong> {info.institucion || '-'}</p>
            <p><strong>Fecha inicio:</strong> {info.inicio || '-'}</p>
            <p><strong>Materia:</strong> {materias.find(m => m.id === materiaSel)?.nombre || '—'}</p>
          </div>
        </div>

        {/* Tabla con cuadrícula*/}
        <div className="px-6 pt-4">
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
                  'Firma Encargado'
                ].map(col => (
                  <th
                    key={col}
                    className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registros.length ? registros.map(r => (
                <tr key={r.id} className="bg-white">
                  <td className="border border-gray-300 px-3 py-1 text-sm">{r.fecha}</td>
                  <td className="border border-gray-300 px-3 py-1 text-sm">{r.horaInicio}</td>
                  <td className="border border-gray-300 px-3 py-1 text-sm">{r.horaFin}</td>
                  <td className="border border-gray-300 px-3 py-1 text-sm">{r.actividad}</td>
                  <td className="border border-gray-300 px-3 py-1 text-sm">{r.aula}</td>
                  <td className="border border-gray-300 px-3 py-1 text-sm">{r.horasEfectivas}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                    No hay registros aprobados.
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
