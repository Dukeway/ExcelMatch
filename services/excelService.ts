import * as XLSX from 'xlsx';
import { UploadedFile, SheetData, ExcelRow } from '../types';

export const parseExcelFile = async (file: File): Promise<UploadedFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // Read the workbook
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheets: SheetData[] = workbook.SheetNames.map((sheetName: string) => {
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON, but keep all values as strings initially to avoid precision loss
          // or ambiguous types, then clean them up.
          // raw: false ensures we get the formatted string (e.g. dates) if possible
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as ExcelRow[];
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
        console.error("Parse error:", error);
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

// Enhanced normalization to handle "123" (string) vs 123 (number) matching issues
export const normalizeValue = (val: any): string => {
  if (val === null || val === undefined) return "";
  const s = String(val).trim();
  // If it looks like a number, try to normalize it (e.g., "123.0" -> "123")
  // strict check to avoid converting "123 abc" to number
  if (!isNaN(Number(s)) && s !== "") {
    return String(Number(s));
  }
  return s.toLowerCase();
};

export const matchData = (
  leftData: ExcelRow[],
  rightData: ExcelRow[],
  leftKey: string,
  rightKey: string,
  appendColumns: string[],
  fuzzy: boolean
): ExcelRow[] => {
  const lookupMap = new Map<string, ExcelRow>();

  // Build Lookup Map
  rightData.forEach(row => {
    const keyRaw = row[rightKey];
    const key = fuzzy ? normalizeValue(keyRaw) : String(keyRaw);
    // If duplicates exist in lookup, first one wins usually. 
    // We strictly map key -> row
    if (key && !lookupMap.has(key)) {
      lookupMap.set(key, row);
    }
  });

  // Perform Join
  return leftData.map(lRow => {
    const lKeyRaw = lRow[leftKey];
    const lKey = fuzzy ? normalizeValue(lKeyRaw) : String(lKeyRaw);
    
    const matchedRow = lookupMap.get(lKey);
    
    const newRow = { ...lRow };
    
    appendColumns.forEach(col => {
      // Prevent overwriting existing columns by appending suffix if needed
      let targetColName = col;
      if (Object.prototype.hasOwnProperty.call(newRow, col)) {
        targetColName = `${col}_matched`;
      }
      
      if (matchedRow) {
        newRow[targetColName] = matchedRow[col];
      } else {
        newRow[targetColName] = "#N/A"; // Distinct marker for no match
      }
    });

    return newRow;
  });
};

export const exportToExcel = (data: ExcelRow[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "MatchedResult");
  XLSX.writeFile(workbook, filename);
};