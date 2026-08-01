import type { MemberStatus } from "@/app/lib/member-status";

export type RevenueDataPoint = {
  label: string;
  amount: number;
};

export type AttendanceDataPoint = {
  day: string;
  percentage: number;
  checkIns: number;
};

export type MembershipStat = {
  tier: string;
  count: number;
  percentage: number;
  color: string;
};

export type ExpiringSoonMember = {
  id: string;
  name: string;
  plan: string;
  avatar: string;
  expiryDate: string;
  daysRemaining: number;
  phone: string;
  memberId: string;
};

export type MemberExportRow = {
  memberId: string;
  name: string;
  phone: string;
  email: string;
  plan: string;
  joinDate: string;
  expiryDate: string;
  daysRemaining: number;
  membershipStatus: MemberStatus;
};

export type InsightMessage = {
  type: "success" | "info" | "warning" | "alert";
  message: string;
  trend: string;
};

export type ActivityLog = {
  id: string;
  type: "join" | "renewal" | "payment" | "expired";
  memberName: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
};

export type ReportKPIs = {
  totalRevenue: number;
  activeMembers: number;
  todayAttendance: number;
  expiringMemberships: number;
};

export type RevenueByRange = Record<"daily" | "weekly" | "monthly" | "yearly", RevenueDataPoint[]>;

export type ReportsData = {
  kpis: ReportKPIs;
  revenue: RevenueByRange;
  attendance: AttendanceDataPoint[];
  membershipStats: MembershipStat[];
  expiringMemberships: ExpiringSoonMember[];
  members: MemberExportRow[];
  recentActivity: ActivityLog[];
  quickInsights: InsightMessage[];
};

export type ReportFilters = {
  dateFrom: string;
  dateTo: string;
  memberId: string;
  planId: string;
};