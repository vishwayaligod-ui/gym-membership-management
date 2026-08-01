import type { ReportsData } from "@/app/reports/types";
import { exportRowsToExcel, getExportDateStamp, type ExcelRow } from "./exportExcel";

export function exportAttendance(data: ReportsData): boolean {
  const rows: ExcelRow[] = data.attendance.map((item) => ({
    Date: item.day,
    "Member Name": "N/A",
    "Check In": `${item.checkIns} check-ins`,
    "Check Out": "N/A",
    Duration: "N/A",
  }));

  const fileName = `Attendance_Report_${getExportDateStamp()}`;
  return exportRowsToExcel(rows, "Attendance Report", fileName);
}
