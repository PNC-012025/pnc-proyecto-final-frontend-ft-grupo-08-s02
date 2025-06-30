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
  const canFilter = /(?:INSTRUCTOR_NORMAL|INSTRUCTOR_REMUNERADO)/i.test(user?.rol ?? '');

  /* materias y materia seleccionada */
  const [materias, setMaterias]     = useState<CatMateria[]>([]);
  const [materiaSel, setMateriaSel] = useState<string>('');

  /* registros aprobados filtrados */
  const [registros, setRegistros]   = useState<RegistroHora[]>([]);

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

  /* ── obtener materias asignadas ── */
  useEffect(() => {
    if (!canFilter) return;
    const rawP = localStorage.getItem('usuarioXmateria');
    const rawM = localStorage.getItem('materias');
    if (!rawP || !rawM) return;
    const puente  = JSON.parse(rawP) as PuenteLS[];
    const catalog = JSON.parse(rawM) as CatMateria[];
    const ids = puente.filter(p => p.id_usuario === userId).map(p => p.id_materia);
    setMaterias(catalog.filter(m => ids.includes(m.id)));
    setMateriaSel(ids[0] || '');
  }, [canFilter, userId]);

  /* ── cargar registros aprobados ── */
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

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#003c71]">Mis Registros Aprobados</h1>
        <div className="flex items-center gap-3">
          {canFilter && (
            <select
              value={materiaSel}
              onChange={e => setMateriaSel(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 bg-white"
            >
              <option value="">Todas las Materias</option>
              {materias.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
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
            <p><strong>Materia:</strong> {materias.find(m => m.id === materiaSel)?.nombre || '—'}</p>
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
              {registros.length ? registros.map(r => (
                <tr key={r.id} className="bg-white hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 text-sm">{r.fecha}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{r.horaInicio}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{r.horaFin}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{r.actividad}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{r.aula}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{r.horasEfectivas}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">________________</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="border border-gray-300 px-4 py-6 text-center text-gray-500">
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
