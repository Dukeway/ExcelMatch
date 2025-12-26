import React, { useMemo } from 'react';
import { ExcelRow } from '../types';
import { exportToExcel } from '../services/excelService';

interface StepPreviewProps {
  data: ExcelRow[];
  onBack: () => void;
  onReset: () => void;
}

export const StepPreview: React.FC<StepPreviewProps> = ({ data, onBack, onReset }) => {
  const headers = useMemo(() => data.length > 0 ? Object.keys(data[0]) : [], [data]);
  
  // Display only first 100 rows for performance in preview
  const displayData = data.slice(0, 100);

  const handleExport = () => {
    exportToExcel(data, `matched_result_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 pb-20 h-screen flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-check-circle text-green-500"></i> Match Complete!
          </h2>
          <p className="text-slate-500 text-sm">Found {data.length} rows. Showing first 100 below.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={onBack}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Adjust Config
          </button>
          <button 
            onClick={handleExport}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-download"></i> Download Excel
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-0">
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 border-b border-r border-slate-200 bg-slate-100 w-12 text-center text-xs font-bold text-slate-500">#</th>
                {headers.map(h => (
                  <th key={h} className="p-3 border-b border-r border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayData.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50 transition-colors group">
                  <td className="p-3 border-r border-slate-100 text-xs text-slate-400 text-center font-mono group-hover:text-blue-500">{idx + 1}</td>
                  {headers.map(h => (
                    <td key={`${idx}-${h}`} className="p-3 border-r border-slate-100 text-sm text-slate-700 whitespace-nowrap max-w-xs overflow-hidden text-ellipsis" title={String(row[h])}>
                      {row[h] === "#N/A" ? <span className="text-red-400 italic text-xs">#N/A</span> : String(row[h])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
          Preview Mode - Download file to see all rows
        </div>
      </div>

       <div className="flex justify-center mt-6 flex-shrink-0">
        <button onClick={onReset} className="text-slate-400 hover:text-red-500 text-sm flex items-center gap-1 transition-colors">
          <i className="fas fa-redo"></i> Start Over
        </button>
      </div>
    </div>
  );
};