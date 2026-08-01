import type { ReportsData } from "@/app/reports/types";
import { exportRowsToExcel, getExportDateStamp, type ExcelRow } from "./exportExcel";

function extractPlanFromDescription(description: string): string {
  const match = /for\s+(.+)\s+plan/i.exec(description);
  return match?.[1] ?? "N/A";
}

export function exportRevenue(data: ReportsData): boolean {
  const paymentActivities = data.recentActivity.filter((item) => item.type === "payment");

  const rows: ExcelRow[] = paymentActivities.map((item) => ({
    Date: item.timestamp,
    "Transaction ID": item.id,
    "Member Name": item.memberName,
    "Membership Plan": extractPlanFromDescription(item.description),
    Amount: "N/A",
    "Payment Method": "N/A",
    "Payment Status": "N/A",
  }));

  const fileName = `Revenue_Report_${getExportDateStamp()}`;
  return exportRowsToExcel(rows, "Revenue Report", fileName);
}
