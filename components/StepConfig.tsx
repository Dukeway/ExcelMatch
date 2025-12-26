import React, { useState, useEffect } from 'react';
import { UploadedFile, MatchConfig } from '../types';
import { suggestMatchColumns } from '../services/geminiService';

interface StepConfigProps {
  files: UploadedFile[];
  onBack: () => void;
  onMatch: (config: MatchConfig) => void;
}

export const StepConfig: React.FC<StepConfigProps> = ({ files, onBack, onMatch }) => {
  // Initialize with safe defaults
  const [leftFileId, setLeftFileId] = useState<string>(files[0]?.id || "");
  const [leftSheetName, setLeftSheetName] = useState<string>("");
  
  // If we have 2 files, default right to the 2nd one. If only 1, default right to the 1st one.
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

  // Helper to find objects securely
  const getFile = (id: string) => files.find(f => f.id === id);
  const getSheet = (fileId: string, sheetName: string) => {
    const file = getFile(fileId);
    return file?.sheets.find(s => s.name === sheetName);
  };

  const leftFile = getFile(leftFileId);
  const rightFile = getFile(rightFileId);
  const leftSheet = getSheet(leftFileId, leftSheetName);
  const rightSheet = getSheet(rightFileId, rightSheetName);

  // Auto-select first sheet if not selected
  useEffect(() => {
    if (leftFile && !leftSheetName && leftFile.sheets.length > 0) {
      setLeftSheetName(leftFile.sheets[0].name);
    }
  }, [leftFile, leftSheetName]);

  useEffect(() => {
    if (rightFile && !rightSheetName && rightFile.sheets.length > 0) {
      // Smart default: if matching within same file, try to pick the 2nd sheet for right side
      if (leftFileId === rightFileId && rightFile.sheets.length > 1) {
        // Find a sheet that isn't the left one, just for convenience
        const otherSheet = rightFile.sheets.find(s => s.name !== leftSheetName);
        setRightSheetName(otherSheet ? otherSheet.name : rightFile.sheets[0].name);
      } else {
        setRightSheetName(rightFile.sheets[0].name);
      }
    }
  }, [rightFile, rightSheetName, leftFileId, rightFileId, leftSheetName]);

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
    setSelectedColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  // Validation
  const isValid = !!(leftSheet && rightSheet && leftKey && rightKey && selectedColumns.length > 0);

  return (
    <div className="max-w-6xl mx-auto p-4 animate-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configure Matching</h2>
          <p className="text-slate-500 text-sm">Define how your datasets should be joined.</p>
        </div>
        <button 
          onClick={handleAiSuggest}
          disabled={aiLoading || !leftSheet || !rightSheet}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
        >
          {aiLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
          AI Auto-Detect Keys
        </button>
      </div>

      {aiReasoning && (
        <div className="mb-6 bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-start gap-3">
          <i className="fas fa-lightbulb text-purple-600 mt-1"></i>
          <div>
            <h4 className="font-semibold text-purple-900 text-sm">AI Suggestion</h4>
            <p className="text-purple-800 text-sm leading-relaxed">{aiReasoning}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Master File Config */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
            <h3 className="font-semibold text-lg text-slate-800">Master Data (Base)</h3>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">File Source</label>
              <select 
                value={leftFileId} 
                onChange={e => setLeftFileId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                {files.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            {leftFile && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sheet</label>
                <select 
                  value={leftSheetName} 
                  onChange={e => setLeftSheetName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  {leftFile.sheets.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            )}

            {leftSheet && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lookup Key Column</label>
                <select 
                  value={leftKey} 
                  onChange={e => setLeftKey(e.target.value)}
                  className="w-full p-2.5 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-blue-900"
                >
                  <option value="">-- Select Unique ID --</option>
                  {leftSheet.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Lookup File Config */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">2</div>
            <h3 className="font-semibold text-lg text-slate-800">Lookup Data (Source)</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">File Source</label>
              <select 
                value={rightFileId} 
                onChange={e => setRightFileId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
              >
                {files.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            {rightFile && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sheet</label>
                <select 
                  value={rightSheetName} 
                  onChange={e => setRightSheetName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                >
                  {rightFile.sheets.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            )}

            {rightSheet && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lookup Key Column</label>
                <select 
                  value={rightKey} 
                  onChange={e => setRightKey(e.target.value)}
                  className="w-full p-2.5 bg-orange-50 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium text-orange-900"
                >
                  <option value="">-- Select Unique ID --</option>
                  {rightSheet.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Output Configuration */}
      <div className="mt-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fas fa-columns text-slate-400"></i> Select Columns to Append
        </h3>
        
        {!rightSheet ? (
          <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Select a Lookup Sheet above to see available columns.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
            {rightSheet.headers.map(h => (
              <label 
                key={h} 
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedColumns.includes(h) 
                    ? 'border-green-500 bg-green-50 text-green-800 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${
                  selectedColumns.includes(h) ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'
                }`}>
                  {selectedColumns.includes(h) && <i className="fas fa-check text-white text-xs"></i>}
                </div>
                <span className="truncate text-sm font-medium" title={h}>{h}</span>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={selectedColumns.includes(h)}
                  onChange={() => toggleColumnSelect(h)}
                />
              </label>
            ))}
          </div>
        )}
        
        <div className="mt-6 pt-6 border-t border-slate-100">
          <label className="flex items-center cursor-pointer group">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={fuzzy} onChange={e => setFuzzy(e.target.checked)} />
              <div className={`block w-10 h-6 rounded-full transition-colors ${fuzzy ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${fuzzy ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <div className="ml-3">
              <span className="text-slate-800 font-medium text-sm block">Smart Format Matching</span>
              <span className="text-slate-500 text-xs block">Ignores capitalization, extra spaces, and treats text/numbers equally (e.g. "123" matches 123)</span>
            </div>
          </label>
        </div>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button 
            onClick={onBack}
            className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2 flex items-center gap-2 transition-colors"
          >
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <button 
            disabled={!isValid}
            onClick={() => onMatch({
              leftFileId, leftSheetName,
              rightFileId, rightSheetName,
              leftKey, rightKey,
              selectedColumns,
              fuzzy
            })}
            className={`px-8 py-3 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 transform active:scale-95 ${
              !isValid 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-200 hover:shadow-xl'
            }`}
          >
            Start Matching Process <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};