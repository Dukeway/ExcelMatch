import * as XLSX from 'xlsx';
import { UploadedFile, SheetData, ExcelRow } from '../types';

export const parseExcelFile = async (file: File): Promise<UploadedFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheets: SheetData[] = workbook.SheetNames.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "" });
          const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
          
          return {
            name: sheetName,
            data: jsonData,
            headers,
          };
        });

        resolve({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          sheets,
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const normalizeValue = (val: any): string => {
  if (val === null || val === undefined) return "";
  return String(val).trim().toLowerCase();
};

export const matchData = (
  leftData: ExcelRow[],
  rightData: ExcelRow[],
  leftKey: string,
  rightKey: string,
  appendColumns: string[],
  fuzzy: boolean
): ExcelRow[] => {
  // Build a lookup map for O(1) access
  // If keys are not unique in rightData, the last one wins (standard VLOOKUP behavior usually takes first, but hash map overwrites. 
  // Let's implement "First Match" behavior to match VLOOKUP by checking existence)
  const lookupMap = new Map<string, ExcelRow>();

  rightData.forEach(row => {
    const keyRaw = row[rightKey];
    const key = fuzzy ? normalizeValue(keyRaw) : String(keyRaw);
    
    // VLOOKUP behavior: keep the first occurrence usually, but Map overwrites.
    // To mimic VLOOKUP finding the *first* match, we only set if not present.
    if (!lookupMap.has(key)) {
      lookupMap.set(key, row);
    }
  });

  return leftData.map(lRow => {
    const lKeyRaw = lRow[leftKey];
    const lKey = fuzzy ? normalizeValue(lKeyRaw) : String(lKeyRaw);
    
    const matchedRow = lookupMap.get(lKey);
    
    const newRow = { ...lRow };
    
    appendColumns.forEach(col => {
      // Avoid column name collision
      let targetColName = col;
      if (col in newRow) {
        targetColName = `${col}_matched`;
      }
      newRow[targetColName] = matchedRow ? matchedRow[col] : "#N/A";
    });

    return newRow;
  });
};

export const exportToExcel = (data: ExcelRow[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Matched Data");
  XLSX.writeFile(workbook, filename);
};