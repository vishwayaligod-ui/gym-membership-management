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
  color: string; // Tailwind class for text/bg color
};

export type ExpiringSoonMember = {
  id: number;
  name: string;
  plan: string;
  avatar: string;
  expiryDate: string;
  daysRemaining: number;
  phone: string;
};

export type InsightMessage = {
  type: "success" | "info" | "warning" | "alert";
  message: string;
  trend: string;
};

export const mockRevenueTrends: Record<"daily" | "weekly" | "monthly" | "yearly", RevenueDataPoint[]> = {
  daily: [
    { label: "06 AM", amount: 12000 },
    { label: "09 AM", amount: 24000 },
    { label: "12 PM", amount: 18000 },
    { label: "03 PM", amount: 15000 },
    { label: "06 PM", amount: 35000 },
    { label: "09 PM", amount: 28000 },
  ],
  weekly: [
    { label: "Mon", amount: 18000 },
    { label: "Tue", amount: 22000 },
    { label: "Wed", amount: 25000 },
    { label: "Thu", amount: 21000 },
    { label: "Fri", amount: 28000 },
    { label: "Sat", amount: 35000 },
    { label: "Sun", amount: 15000 },
  ],
  monthly: [
    { label: "Jan", amount: 145000 },
    { label: "Feb", amount: 160000 },
    { label: "Mar", amount: 155000 },
    { label: "Apr", amount: 172000 },
    { label: "May", amount: 188000 },
    { label: "Jun", amount: 195000 },
    { label: "Jul", amount: 215000 },
  ],
  yearly: [
    { label: "2022", amount: 1240000 },
    { label: "2023", amount: 1580000 },
    { label: "2024", amount: 1890000 },
    { label: "2025", amount: 2150000 },
    { label: "2026", amount: 2480000 },
  ],
};

export const mockAttendanceData: AttendanceDataPoint[] = [
  { day: "Mon", percentage: 78, checkIns: 78 },
  { day: "Tue", percentage: 85, checkIns: 85 },
  { day: "Wed", percentage: 92, checkIns: 92 },
  { day: "Thu", percentage: 84, checkIns: 84 }, // Today (July 16)
  { day: "Fri", percentage: 80, checkIns: 80 },
  { day: "Sat", percentage: 65, checkIns: 65 },
  { day: "Sun", percentage: 45, checkIns: 45 },
];

export const mockMembershipStats: MembershipStat[] = [
  { tier: "Platinum", count: 420, percentage: 33.6, color: "bg-blue-600 text-blue-600 border-blue-200" },
  { tier: "Gold", count: 380, percentage: 30.4, color: "bg-amber-500 text-amber-500 border-amber-200" },
  { tier: "Silver", count: 290, percentage: 23.2, color: "bg-slate-400 text-slate-400 border-slate-200" },
  { tier: "Basic", count: 158, percentage: 12.8, color: "bg-zinc-600 text-zinc-600 border-zinc-200" },
];

export const mockExpiringMemberships: ExpiringSoonMember[] = [
  { id: 1, name: "Riya Sharma", plan: "Platinum", avatar: "RS", expiryDate: "Jul 16, 2026", daysRemaining: 0, phone: "+91 98765 43210" },
  { id: 2, name: "Vikram Singh", plan: "Classic", avatar: "VS", expiryDate: "Jul 17, 2026", daysRemaining: 1, phone: "+91 95432 10987" },
  { id: 3, name: "Aman Verma", plan: "Classic", avatar: "AV", expiryDate: "Jul 19, 2026", daysRemaining: 3, phone: "+91 99876 54321" },
  { id: 4, name: "Pooja Hegde", plan: "Premium", avatar: "PH", expiryDate: "Jul 22, 2026", daysRemaining: 6, phone: "+91 94321 09876" },
];

export const mockQuickInsights: InsightMessage[] = [
  { type: "success", message: "Revenue increased 12% compared to last calendar month", trend: "+12%" },
  { type: "info", message: "Today's attendance is the highest recorded check-in volume this week", trend: "Peak" },
  { type: "warning", message: "15 renewals due in the next 48 hours require proactive outreach", trend: "Action" },
  { type: "alert", message: "5 inactive members have not attended in 14 days, risk of churn", trend: "Risk" },
];
