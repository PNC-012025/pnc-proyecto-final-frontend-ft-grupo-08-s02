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
    const [registros, setRegistros] = useState<RegistroHora[]>([]);
    const tableRef = useRef<HTMLTableElement>(null);

    useEffect(() => {
        const data = localStorage.getItem('registros');
        if (data) {
            const all = JSON.parse(data) as RegistroHora[];
            setRegistros(all.filter(r => r.estudianteId === user?.nombre));
        }
    }, [userId]);

    const handleDownloadPdf = async () => {
        if (!tableRef.current) return;
        const canvas = await html2canvas(tableRef.current);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`registros_${userId}_${new Date().toISOString().slice(0, 7)}.pdf`);
    };

    return (
        <div className="space-y-6 p-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#003c71]">Mis registros</h2>
                <button
                    onClick={handleDownloadPdf}
                    className="bg-[#003c71] text-white px-4 py-2 rounded hover:bg-[#002f59]"
                >
                    Descargar PDF
                </button>
            </div>

            <div className="overflow-x-auto">
                <table ref={tableRef} className="min-w-full bg-white rounded shadow">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700 text-left">
                            <th className="px-4 py-2">Fecha</th>
                            <th className="px-4 py-2">Hora inicio</th>
                            <th className="px-4 py-2">Hora fin</th>
                            <th className="px-4 py-2">Actividad</th>
                            <th className="px-4 py-2">Aula</th>
                            <th className="px-4 py-2">Horas efectivas</th>
                            <th className="px-4 py-2">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registros.map(reg => (
                            <tr key={reg.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2">{reg.fecha}</td>
                                <td className="px-4 py-2">{reg.horaInicio}</td>
                                <td className="px-4 py-2">{reg.horaFin}</td>
                                <td className="px-4 py-2">{reg.actividad}</td>
                                <td className="px-4 py-2">{reg.aula}</td>
                                <td className="px-4 py-2">{reg.horasEfectivas}</td>
                                <td className="px-4 py-2">{reg.estado}</td>
                            </tr>
                        ))}
                        {registros.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-2 text-center text-gray-500">
                                    No tienes registros aún.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            </div>
        );
    };
    
    export default RegistrosPage;