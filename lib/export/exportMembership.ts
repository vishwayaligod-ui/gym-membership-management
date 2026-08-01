import type { ReportsData } from "@/app/reports/types";
import * as XLSX from "xlsx";
import { getExportDateStamp, type ExcelRow } from "./exportExcel";

export function exportMembership(data: ReportsData): boolean {
  const members = data.members.filter(
    (member) =>
      member.memberId &&
      member.name &&
      member.phone &&
      member.email !== undefined &&
      member.plan &&
      member.joinDate &&
      member.expiryDate &&
      member.membershipStatus
  );

  if (members.length === 0) {
    return false;
  }

  const rows: ExcelRow[] = members.map((member) => ({
    "Member ID": member.memberId,
    "Member Name": member.name,
    Phone: member.phone,
    Email: member.email,
    Plan: member.plan,
    "Join Date": member.joinDate,
    "Expiry Date": member.expiryDate,
    "Days Remaining": member.daysRemaining,
    "Membership Status": member.membershipStatus,
  }));

  const fileName = `Membership_Report_${getExportDateStamp()}`;
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [
      "Member ID",
      "Member Name",
      "Phone",
      "Email",
      "Plan",
      "Join Date",
      "Expiry Date",
      "Days Remaining",
      "Membership Status",
    ],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Membership Report");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
  return true;
}
