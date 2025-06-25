import React, { useState, useEffect, useRef } from 'react';
import useAuth from '../../hooks/useAuth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
}

const RegistrosPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  /* ─── NUEVO: detecta cualquier rol que empiece por INSTRUCTOR_ ─── */
  const isInstructor = user?.rol?.startsWith('INSTRUCTOR_') ?? false;

  const [registros, setRegistros] = useState<RegistroHora[]>([]);
  const printableRef = useRef<HTMLDivElement>(null);

  /* Formulario visible para instructores */
  const [info, setInfo] = useState({
    nombre: user?.nombre || '',
    carrera: '',
    carnet: '',
    telefono: '',
    proyecto: '',
    institucion: '',
    inicio: '',
  });

  useEffect(() => {
    const data = localStorage.getItem('registros');
    if (data) {
      const all = JSON.parse(data) as RegistroHora[];
      setRegistros(
        all.filter(
          (r) => r.estudianteId === userId && r.estado === 'APROBADO'
        )
      );
    }
  }, [userId]);

  const handleDownloadPdf = async () => {
    if (!printableRef.current) return;
    const canvas = await html2canvas(printableRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(
      `asistencia_${userId}_${new Date().toISOString().slice(0, 10)}.pdf`
    );
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[rgb(0,60,113)]">
          Mis registros aprobados
        </h2>
        <button
          onClick={handleDownloadPdf}
          className="bg-[rgb(0,60,113)] text-white px-4 py-2 rounded hover:bg-[rgb(0,50,95)]"
        >
          Descargar PDF
        </button>
      </div>

      {/* Formulario para cualquier instructor (social o remunerado) */}
      {isInstructor && (
        <div className="bg-white p-4 rounded shadow-md space-y-4">
          <h3 className="font-semibold text-[rgb(0,60,113)]">
            Información para Control de Asistencia
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Carrera"
              value={info.carrera}
              onChange={(e) => setInfo({ ...info, carrera: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
            <input
              type="text"
              placeholder="Número de Carné"
              value={info.carnet}
              onChange={(e) => setInfo({ ...info, carnet: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
            <input
              type="tel"
              placeholder="Número de teléfono"
              value={info.telefono}
              onChange={(e) => setInfo({ ...info, telefono: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
            <input
              type="text"
              placeholder="Nombre del proyecto o actividad"
              value={info.proyecto}
              onChange={(e) => setInfo({ ...info, proyecto: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
            <input
              type="text"
              placeholder="Responsable de la unidad o institución"
              value={info.institucion}
              onChange={(e) =>
                setInfo({ ...info, institucion: e.target.value })
              }
              className="border rounded px-3 py-2 w-full"
            />
            <input
              type="date"
              placeholder="Fecha de inicio"
              value={info.inicio}
              onChange={(e) => setInfo({ ...info, inicio: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
        </div>
      )}

      {/* Área imprimible */}
      <div
        ref={printableRef}
        className="bg-white p-4 rounded shadow-md space-y-4"
      >
        {isInstructor && (
          <div className="text-sm space-y-1">
            <div>
              <strong>Nombre del estudiante:</strong> {info.nombre}
            </div>
            <div>
              <strong>Carrera:</strong> {info.carrera}{' '}
              <strong>Carné:</strong> {info.carnet}
            </div>
            <div>
              <strong>Teléfono:</strong> {info.telefono}
            </div>
            <div>
              <strong>Proyecto/Actividad:</strong> {info.proyecto}
            </div>
            <div>
              <strong>Responsable:</strong> {info.institucion}
            </div>
            <div>
              <strong>Fecha inicio:</strong> {info.inicio}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-left">
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Hora inicio</th>
                <th className="px-4 py-2">Hora fin</th>
                <th className="px-4 py-2">Actividad</th>
                <th className="px-4 py-2">Aula</th>
                <th className="px-4 py-2">Horas efectivas</th>
              </tr>
            </thead>
            <tbody>
              {registros.length > 0 ? (
                registros.map((reg) => (
                  <tr key={reg.id} className="border-b">
                    <td className="px-4 py-2">{reg.fecha}</td>
                    <td className="px-4 py-2">{reg.horaInicio}</td>
                    <td className="px-4 py-2">{reg.horaFin}</td>
                    <td className="px-4 py-2">{reg.actividad}</td>
                    <td className="px-4 py-2">{reg.aula}</td>
                    <td className="px-4 py-2">{reg.horasEfectivas}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-2 text-center text-gray-500"
                  >
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
