import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export type ExcelCell = string | number | null;
export type ExcelRow = Record<string, ExcelCell>;

export function getExportDateStamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function exportRowsToExcel(rows: ExcelRow[], sheetName: string, fileName: string): boolean {
  if (rows.length === 0) {
    return false;
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `${fileName}.xlsx`);
  return true;
}
