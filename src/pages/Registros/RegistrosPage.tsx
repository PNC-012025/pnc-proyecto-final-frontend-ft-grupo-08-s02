// src/pages/Registros/RegistrosPage.tsx
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

  const [info, setInfo] = useState({
    nombre: user?.nombre || '',
    carrera: '',
    carnet: '',
    telefono: '',
    proyecto: '',
    institucion: '',
    inicio: '',
  });

  /* ── 1. obtener materias (puente + catálogo) ── */
  useEffect(() => {
    if (!canFilter) return;

    const rawP = localStorage.getItem('usuarioXmateria');
    const rawM = localStorage.getItem('materias');
    if (!rawP || !rawM) return;

    const puente = JSON.parse(rawP) as PuenteLS[];
    const catalog = JSON.parse(rawM) as CatMateria[];

    const ids = puente
      .filter(p => p.id_usuario === userId)
      .map(p => p.id_materia);

    const lista = catalog.filter(m => ids.includes(m.id));

    setMaterias(lista);
    setMateriaSel(lista[0]?.id ?? '');
  }, [canFilter, userId]);

  /* ── 2. carga de registros ── */
  useEffect(() => {
    const raw = localStorage.getItem('registros');
    if (!raw) { setRegistros([]); return; }

    const all = JSON.parse(raw) as RegistroHora[];
    setRegistros(
      all.filter(r =>
        r.estudianteId === userId &&
        r.estado === 'APROBADO' &&
        (!materiaSel || r.materia === materiaSel)
      )
    );
  }, [userId, materiaSel]);

  /* ── 3. PDF ── */
  const downloadPdf = async () => {
    if (!printableRef.current) return;
    const canvas = await html2canvas(printableRef.current);
    const pdf = new jsPDF('l', 'pt', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
    const slug = (materiaSel || 'general').replace(/\s+/g, '_');
    pdf.save(`asistencia_${slug}_${userId}_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Título, filtro y PDF */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-[rgb(0,60,113)]">
            Mis registros aprobados
          </h2>

          {/* Filtro de materias */}
          {canFilter && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Materia:</span>
              {materias.length ? (
                <select
                  value={materiaSel}
                  onChange={e => setMateriaSel(e.target.value)}
                  className="border px-2 py-1 rounded"
                >
                  <option value="">Todas</option>
                  {materias.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="italic text-gray-500">— sin materias —</span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={downloadPdf}
          className="self-start md:self-auto bg-[rgb(0,60,113)] text-white px-4 py-2 rounded hover:bg-[rgb(0,50,95)]"
        >
          Descargar PDF
        </button>
      </div>

      {/* formulario para instructores */}
      {canFilter && (
        <div className="bg-white p-4 rounded shadow-md space-y-4">
          <h3 className="font-semibold text-[rgb(0,60,113)]">
            Información para Control de Asistencia
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(
              ['Carrera', 'Número de Carné', 'Número de teléfono', 'Nombre del proyecto o actividad',
                'Responsable de la unidad', 'Fecha de inicio'] as const
            ).map((ph, idx) => {
              const key = ['carrera', 'carnet', 'telefono', 'proyecto', 'institucion', 'inicio'][idx] as keyof typeof info;
              return (
                <input
                  key={key}
                  type={key === 'inicio' ? 'date' : key === 'telefono' ? 'tel' : 'text'}
                  placeholder={ph}
                  value={info[key]}
                  onChange={e => setInfo({ ...info, [key]: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
              );
            })}
          </div>
        </div>
      )}

      {/* zona imprimible */}
      <div ref={printableRef} className="bg-white p-4 rounded shadow-md space-y-4">
        {canFilter && (
          <div className="text-sm space-y-1">
            <div><strong>Nombre del estudiante:</strong> {info.nombre}</div>
            <div><strong>Carrera:</strong> {info.carrera} <strong>Carné:</strong> {info.carnet}</div>
            <div><strong>Teléfono:</strong> {info.telefono}</div>
            <div><strong>Proyecto/Actividad:</strong> {info.proyecto}</div>
            <div><strong>Responsable:</strong> {info.institucion}</div>
            <div><strong>Fecha inicio:</strong> {info.inicio}</div>
            <div><strong>Materia:</strong> {materias.find(m => m.id === materiaSel)?.nombre || '—'}</div>
          </div>
        )}

        {/* tabla de registros */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-left">
                {['Fecha', 'Hora inicio', 'Hora fin', 'Actividad', 'Aula', 'Horas efectivas'].map(c => (
                  <th key={c} className="px-4 py-2">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registros.length ? registros.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{r.fecha}</td>
                  <td className="px-4 py-2">{r.horaInicio}</td>
                  <td className="px-4 py-2">{r.horaFin}</td>
                  <td className="px-4 py-2">{r.actividad}</td>
                  <td className="px-4 py-2">{r.aula}</td>
                  <td className="px-4 py-2">{r.horasEfectivas}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-2 text-center text-gray-500">
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
