export interface ExcelRow {
  [key: string]: any;
}

export interface SheetData {
  name: string;
  data: ExcelRow[];
  headers: string[];
}

export interface UploadedFile {
  id: string;
  name: string;
  sheets: SheetData[];
}

export interface MatchConfig {
  leftFileId: string;
  leftSheetName: string;
  rightFileId: string;
  rightSheetName: string;
  leftKey: string;
  rightKey: string;
  selectedColumns: string[]; // Columns from right table to append
  fuzzy: boolean;
}

export enum AppStep {
  UPLOAD = 'UPLOAD',
  CONFIGURE = 'CONFIGURE',
  PREVIEW = 'PREVIEW',
}