import type { ReportsData } from "@/app/reports/types";
import { exportRowsToExcel, getExportDateStamp, type ExcelRow } from "./exportExcel";

export function exportPayments(data: ReportsData): boolean {
  const paymentActivities = data.recentActivity.filter((item) => item.type === "payment");

  const rows: ExcelRow[] = paymentActivities.map((item) => ({
    "Transaction ID": item.id,
    "Member Name": item.memberName,
    Amount: "N/A",
    "Payment Method": "N/A",
    Status: "PAID",
    "Payment Date": item.timestamp,
  }));

  const fileName = `Payment_Report_${getExportDateStamp()}`;
  return exportRowsToExcel(rows, "Payment Report", fileName);
}
