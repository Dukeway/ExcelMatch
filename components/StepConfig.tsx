import React, { useState, useEffect } from 'react';
import { UploadedFile, MatchConfig, SheetData } from '../types';
import { suggestMatchColumns } from '../services/geminiService';

interface StepConfigProps {
  files: UploadedFile[];
  onBack: () => void;
  onMatch: (config: MatchConfig) => void;
}

export const StepConfig: React.FC<StepConfigProps> = ({ files, onBack, onMatch }) => {
  // Config State
  const [leftFileId, setLeftFileId] = useState<string>(files[0]?.id || "");
  const [leftSheetName, setLeftSheetName] = useState<string>("");
  
  // Default right file to the second file if available, otherwise the first file
  const [rightFileId, setRightFileId] = useState<string>(
    files.length > 1 ? files[1].id : (files[0]?.id || "")
  );
  const [rightSheetName, setRightSheetName] = useState<string>("");

  const [leftKey, setLeftKey] = useState<string>("");
  const [rightKey, setRightKey] = useState<string>("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [fuzzy, setFuzzy] = useState<boolean>(true);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);

  // Derived state helpers
  const getFile = (id: string) => files.find(f => f.id === id);
  const getSheet = (fileId: string, sheetName: string) => {
    const file = getFile(fileId);
    return file?.sheets.find(s => s.name === sheetName);
  };

  const leftFile = getFile(leftFileId);
  const rightFile = getFile(rightFileId);
  const leftSheet = getSheet(leftFileId, leftSheetName);
  const rightSheet = getSheet(rightFileId, rightSheetName);

  // Set default sheets when files change
  useEffect(() => {
    if (leftFile && !leftSheetName && leftFile.sheets.length > 0) {
      setLeftSheetName(leftFile.sheets[0].name);
    }
  }, [leftFile, leftSheetName]);

  useEffect(() => {
    if (rightFile && !rightSheetName && rightFile.sheets.length > 0) {
      // If we are looking at the same file for both left and right, 
      // and it has multiple sheets, try to select the second sheet for the right side by default
      if (leftFileId === rightFileId && leftFile && leftFile.sheets.length > 1) {
         // This logic runs when rightFile changes. 
         // If leftSheet is already selected (e.g. index 0), we might prefer index 1 for right.
         // However, this effect runs independently. 
         // Simple default: index 0. User can change it.
         setRightSheetName(rightFile.sheets[0].name);
      } else {
         setRightSheetName(rightFile.sheets[0].name);
      }
    }
  }, [rightFile, rightSheetName, leftFileId, rightFileId]);

  const handleAiSuggest = async () => {
    if (!leftSheet || !rightSheet) return;
    setAiLoading(true);
    setAiReasoning(null);
    
    const suggestion = await suggestMatchColumns(
      leftFile?.name || "File 1",
      leftSheet.headers,
      rightFile?.name || "File 2",
      rightSheet.headers
    );

    if (suggestion) {
      if (leftSheet.headers.includes(suggestion.leftKey)) setLeftKey(suggestion.leftKey);
      if (rightSheet.headers.includes(suggestion.rightKey)) setRightKey(suggestion.rightKey);
      setAiReasoning(suggestion.reasoning);
    }
    setAiLoading(false);
  };

  const toggleColumnSelect = (col: string) => {
    if (selectedColumns.includes(col)) {
      setSelectedColumns(selectedColumns.filter(c => c !== col));
    } else {
      setSelectedColumns([...selectedColumns, col]);
    }
  };

  const canProceed = leftSheet && rightSheet && leftKey && rightKey && selectedColumns.length > 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Configure Matching Logic</h2>
        <button 
          onClick={handleAiSuggest}
          disabled={aiLoading || !leftSheet || !rightSheet}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {aiLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
          AI Auto-Detect Keys
        </button>
      </div>

      {aiReasoning && (
        <div className="mb-6 bg-purple-50 border border-purple-200 p-4 rounded-lg flex items-start gap-3 animate-fade-in">
          <i className="fas fa-robot text-purple-600 mt-1"></i>
          <div>
            <h4 className="font-semibold text-purple-900 text-sm">AI Suggestion</h4>
            <p className="text-purple-800 text-sm">{aiReasoning}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT CONFIG */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">MASTER</span>
            <h3 className="font-semibold text-lg text-slate-800">Master Data (Left)</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Select File</label>
              <select 
                value={leftFileId} 
                onChange={e => setLeftFileId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {files.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            {leftFile && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Select Sheet</label>
                <select 
                  value={leftSheetName} 
                  onChange={e => setLeftSheetName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {leftFile.sheets.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            )}

            {leftSheet && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Unique Identifier (Key)</label>
                <select 
                  value={leftKey} 
                  onChange={e => setLeftKey(e.target.value)}
                  className="w-full p-2 border-2 border-blue-100 bg-blue-50 rounded focus:ring-2 focus:ring-blue-500 outline-none font-medium text-blue-900"
                >
                  <option value="">-- Select Key Column --</option>
                  {leftSheet.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <p className="text-xs text-slate-400 mt-1">Common column to match against (e.g. Email, ID)</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CONFIG */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">LOOKUP</span>
            <h3 className="font-semibold text-lg text-slate-800">Lookup Data (Right)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Select File</label>
              <select 
                value={rightFileId} 
                onChange={e => setRightFileId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
              >
                {files.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            {rightFile && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Select Sheet</label>
                <select 
                  value={rightSheetName} 
                  onChange={e => setRightSheetName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  {rightFile.sheets.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            )}

            {rightSheet && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Unique Identifier (Key)</label>
                <select 
                  value={rightKey} 
                  onChange={e => setRightKey(e.target.value)}
                  className="w-full p-2 border-2 border-orange-100 bg-orange-50 rounded focus:ring-2 focus:ring-orange-500 outline-none font-medium text-orange-900"
                >
                  <option value="">-- Select Key Column --</option>
                  {rightSheet.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COLUMN SELECTION & OPTIONS */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-semibold text-lg text-slate-800 mb-4">Select Columns to Append</h3>
        
        {!rightSheet ? (
          <p className="text-slate-400 italic">Please select a Lookup Sheet first.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {rightSheet.headers.map(h => (
              <label 
                key={h} 
                className={`flex items-center p-3 rounded border cursor-pointer transition-all ${
                  selectedColumns.includes(h) 
                    ? 'border-green-500 bg-green-50 text-green-800' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={selectedColumns.includes(h)}
                  onChange={() => toggleColumnSelect(h)}
                  className="mr-2 accent-green-600"
                />
                <span className="truncate text-sm" title={h}>{h}</span>
              </label>
            ))}
          </div>
        )}
        
        <div className="mt-6 pt-6 border-t border-slate-100">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={fuzzy} onChange={e => setFuzzy(e.target.checked)} />
              <div className={`block w-10 h-6 rounded-full ${fuzzy ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${fuzzy ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <div className="ml-3 text-slate-700 font-medium text-sm">
              Enable Fuzzy/Clean Matching 
              <span className="text-slate-400 font-normal ml-1">(Ignores case & extra spaces - Recommended)</span>
            </div>
          </label>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-xl z-10 flex justify-between items-center max-w-6xl mx-auto md:relative md:bg-transparent md:border-none md:shadow-none md:p-0 md:mt-8">
        <button 
          onClick={onBack}
          className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2"
        >
          Back
        </button>
        <button 
          disabled={!canProceed}
          onClick={() => onMatch({
            leftFileId, leftSheetName,
            rightFileId, rightSheetName,
            leftKey, rightKey,
            selectedColumns,
            fuzzy
          })}
          className={`px-8 py-3 rounded-lg font-semibold shadow-lg transition-all ${
            !canProceed 
              ? 'bg-slate-300 text-white cursor-not-allowed' 
              : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-xl'
          }`}
        >
          Run Match Logic <i className="fas fa-bolt ml-2"></i>
        </button>
      </div>
    </div>
  );
};