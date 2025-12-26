import React, { useRef, useState } from 'react';
import { parseExcelFile } from '../services/excelService';
import { UploadedFile } from '../types';

interface StepUploadProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  onNext: () => void;
}

export const StepUpload: React.FC<StepUploadProps> = ({ files, setFiles, onNext }) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setLoading(true);
      const newFiles: UploadedFile[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        try {
          const fileData = await parseExcelFile(e.target.files[i]);
          newFiles.push(fileData);
        } catch (err) {
          console.error("Error parsing file", err);
          alert(`Failed to parse ${e.target.files[i].name}`);
        }
      }
      setFiles(prev => [...prev, ...newFiles]);
      setLoading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const canProceed = files.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Upload Your Data</h2>
        <p className="text-slate-500">
          Upload Excel files (.xlsx, .xls) to start matching. 
          <br/>
          <span className="text-sm text-slate-400">You can match data between different files or sheets within the same file.</span>
        </p>
      </div>

      <div 
        className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer bg-white"
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          multiple 
          accept=".xlsx, .xls" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        {loading ? (
          <div className="animate-pulse flex flex-col items-center">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
            <span className="text-slate-600 font-medium">Processing files...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="bg-blue-100 p-4 rounded-full mb-4">
              <i className="fas fa-file-excel text-3xl text-blue-600"></i>
            </div>
            <p className="text-lg font-medium text-slate-700">Click to upload files</p>
            <p className="text-sm text-slate-400 mt-1">Supports .xlsx, .xls</p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Uploaded Files ({files.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map(file => (
              <div key={file.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-file-excel text-green-600 text-xl"></i>
                  <div>
                    <div className="font-medium text-slate-800">{file.name}</div>
                    <div className="text-xs text-slate-500">{file.sheets.length} Sheet(s)</div>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(file.id)}
                  className="text-red-400 hover:text-red-600 p-2"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex justify-end">
        <button 
          disabled={!canProceed}
          onClick={onNext}
          className={`px-8 py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center gap-2 ${
            !canProceed 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl'
          }`}
        >
          Next: Configure Match <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};