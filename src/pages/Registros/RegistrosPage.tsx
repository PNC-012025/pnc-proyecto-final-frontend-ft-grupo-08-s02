import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const RegistrosPage: React.FC = () => {
    const pdfRef = useRef<HTMLDivElement>(null);

    const handleDownloadPDF = async () => {
        const input = pdfRef.current;
        if (!input) return;

        const canvas = await html2canvas(input);
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF();
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('registro_mensual.pdf');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#003c71]">Mis registros</h2>
                <button
                    onClick={handleDownloadPDF}
                    className="px-4 py-2 bg-[#003c71] text-white rounded hover:bg-[#002f59]"
                >
                    Descargar PDF
                </button>
            </div>

            <div className="overflow-x-auto" ref={pdfRef}>
                <table className="min-w-full bg-white rounded shadow">
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
                        <tr>
                            <td className="px-4 py-2">2025-06-01</td>
                            <td className="px-4 py-2">08:00</td>
                            <td className="px-4 py-2">10:00</td>
                            <td className="px-4 py-2">Apoyo biblioteca</td>
                            <td className="px-4 py-2">Aula 101</td>
                            <td className="px-4 py-2">2.0</td>
                            <td className="px-4 py-2">Pendiente</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RegistrosPage;