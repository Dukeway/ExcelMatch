import React, { useState } from 'react';
import { UploadedFile, AppStep, MatchConfig, ExcelRow } from './types';
import { StepUpload } from './components/StepUpload';
import { StepConfig } from './components/StepConfig';
import { StepPreview } from './components/StepPreview';
import { matchData } from './services/excelService';

// Ensure xlsx is loaded. In a real environment, this might be handled by bundlers.
// For this single-file output simulation, we rely on the implementation in excelService.ts which uses 'import * as XLSX'.
// If using a pure CDN approach in HTML, we would use window.XLSX.

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [resultData, setResultData] = useState<ExcelRow[]>([]);

  const handleMatch = (config: MatchConfig) => {
    const leftFile = files.find(f => f.id === config.leftFileId);
    const rightFile = files.find(f => f.id === config.rightFileId);
    
    if (!leftFile || !rightFile) return;

    const leftSheet = leftFile.sheets.find(s => s.name === config.leftSheetName);
    const rightSheet = rightFile.sheets.find(s => s.name === config.rightSheetName);

    if (!leftSheet || !rightSheet) return;

    // Perform the matching
    const matched = matchData(
      leftSheet.data,
      rightSheet.data,
      config.leftKey,
      config.rightKey,
      config.selectedColumns,
      config.fuzzy
    );

    setResultData(matched);
    setStep(AppStep.PREVIEW);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
              E
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">
              Excel<span className="text-blue-600">Match</span> Pro
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Progress Indicators */}
             <div className="hidden md:flex items-center space-x-2 text-sm">
                <div className={`flex items-center gap-2 ${step === AppStep.UPLOAD ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${step === AppStep.UPLOAD ? 'border-blue-600 bg-blue-50' : 'border-slate-300'}`}>1</span>
                  Upload
                </div>
                <div className="w-8 h-px bg-slate-300"></div>
                <div className={`flex items-center gap-2 ${step === AppStep.CONFIGURE ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${step === AppStep.CONFIGURE ? 'border-blue-600 bg-blue-50' : 'border-slate-300'}`}>2</span>
                  Configure
                </div>
                <div className="w-8 h-px bg-slate-300"></div>
                <div className={`flex items-center gap-2 ${step === AppStep.PREVIEW ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${step === AppStep.PREVIEW ? 'border-blue-600 bg-blue-50' : 'border-slate-300'}`}>3</span>
                  Result
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="animate-fade-in-up">
        {step === AppStep.UPLOAD && (
          <StepUpload 
            files={files} 
            setFiles={setFiles} 
            onNext={() => setStep(AppStep.CONFIGURE)} 
          />
        )}
        
        {step === AppStep.CONFIGURE && (
          <StepConfig 
            files={files} 
            onBack={() => setStep(AppStep.UPLOAD)} 
            onMatch={handleMatch}
          />
        )}

        {step === AppStep.PREVIEW && (
          <StepPreview 
            data={resultData} 
            onBack={() => setStep(AppStep.CONFIGURE)}
            onReset={() => {
              setFiles([]);
              setResultData([]);
              setStep(AppStep.UPLOAD);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;