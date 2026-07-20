// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RevenueComparison = {
  label: string;
  current: string;
  previous: string;
  percentage: number;
  trend: "up" | "down";
};

export type MonthlyRevenuePoint = {
  month: string;
  amount: number;
};

export type PaymentMethod = {
  method: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
};

export type PlanRevenue = {
  plan: string;
  amount: number;
  count: number;
  color: string;
};

export type RevenueInsight = {
  type: "success" | "info" | "warning" | "alert";
  message: string;
  trend: string;
};

export type TopMember = {
  name: string;
  plan: string;
  avatar: string;
  amount: number;
};

export type RevenueBreakdownItem = {
  category: string;
  amount: number;
  percentage: number;
  icon: string;
  color: string;
};

export type MonthlyTrendCard = {
  month: string;
  revenue: number;
  growth: number;
};

export type MembershipPlan = {
  name: string;
  members: number;
  revenue: number;
  color: string;
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export const mockComparisons: RevenueComparison[] = [
  { label: "Total Revenue", current: "₹18,42,500", previous: "₹16,10,000", percentage: 14.4, trend: "up" },
  { label: "Active Members", current: "1,248", previous: "1,180", percentage: 5.8, trend: "up" },
  { label: "Avg. Revenue / Member", current: "₹1,476", previous: "₹1,364", percentage: 8.2, trend: "up" },
  { label: "Churn Rate", current: "3.2%", previous: "4.1%", percentage: 22, trend: "down" },
];

export const mockMonthlyRevenue: MonthlyRevenuePoint[] = [
  { month: "Jan", amount: 145000 },
  { month: "Feb", amount: 160000 },
  { month: "Mar", amount: 155000 },
  { month: "Apr", amount: 172000 },
  { month: "May", amount: 188000 },
  { month: "Jun", amount: 195000 },
  { month: "Jul", amount: 215000 },
  { month: "Aug", amount: 210000 },
  { month: "Sep", amount: 225000 },
  { month: "Oct", amount: 240000 },
  { month: "Nov", amount: 255000 },
  { month: "Dec", amount: 270000 },
];

export const mockPaymentMethods: PaymentMethod[] = [
  { method: "UPI", amount: 825000, percentage: 45, count: 1240, color: "bg-blue-500" },
  { method: "Credit Card", amount: 485000, percentage: 26, count: 720, color: "bg-emerald-500" },
  { method: "Debit Card", amount: 320000, percentage: 17, count: 480, color: "bg-amber-500" },
  { method: "Cash", amount: 125000, percentage: 7, count: 190, color: "bg-slate-400" },
  { method: "Net Banking", amount: 87500, percentage: 5, count: 130, color: "bg-indigo-500" },
];

export const mockPlanRevenue: PlanRevenue[] = [
  { plan: "Platinum", amount: 725000, count: 420, color: "bg-blue-600" },
  { plan: "Gold", amount: 580000, count: 380, color: "bg-amber-500" },
  { plan: "Silver", amount: 365000, count: 290, color: "bg-slate-400" },
  { plan: "Basic", amount: 172500, count: 158, color: "bg-zinc-600" },
];

export const mockRevenueInsights: RevenueInsight[] = [
  { type: "success", message: "Revenue increased 14.4% compared to last month", trend: "+14.4%" },
  { type: "info", message: "UPI payments now account for 45% of all transactions", trend: "Dominant" },
  { type: "warning", message: "Churn rate dropped to 3.2%, the lowest this quarter", trend: "Improving" },
  { type: "alert", message: "5 members with Platinum plans are at risk of downgrade", trend: "At Risk" },
];

export const mockTopMembers: TopMember[] = [
  { name: "Riya Sharma", plan: "Platinum", avatar: "RS", amount: 12500 },
  { name: "Vikram Singh", plan: "Platinum", avatar: "VS", amount: 12500 },
  { name: "Aman Verma", plan: "Gold", avatar: "AV", amount: 8900 },
  { name: "Pooja Hegde", plan: "Gold", avatar: "PH", amount: 8900 },
  { name: "Arjun Mehta", plan: "Silver", avatar: "AM", amount: 5400 },
];

export const mockRevenueBreakdown: RevenueBreakdownItem[] = [
  { category: "Membership Revenue", amount: 1242500, percentage: 67, icon: "💳", color: "bg-blue-50 text-blue-600" },
  { category: "Admission Fees", amount: 355000, percentage: 19, icon: "🎟️", color: "bg-emerald-50 text-emerald-600" },
  { category: "PT Sessions", amount: 200000, percentage: 11, icon: "🏃", color: "bg-purple-50 text-purple-600" },
  { category: "Other Income", amount: 45000, percentage: 3, icon: "📊", color: "bg-amber-50 text-amber-600" },
];

export const mockMonthlyTrend: MonthlyTrendCard[] = [
  { month: "July", revenue: 215000, growth: 10.3 },
  { month: "August", revenue: 210000, growth: -2.3 },
  { month: "September", revenue: 225000, growth: 7.1 },
  { month: "October", revenue: 240000, growth: 6.7 },
  { month: "November", revenue: 255000, growth: 6.3 },
  { month: "December", revenue: 270000, growth: 5.9 },
];

export const mockMembershipPlans: MembershipPlan[] = [
  { name: "Platinum", members: 420, revenue: 942000, color: "from-blue-600 to-blue-700" },
  { name: "Premium", members: 525, revenue: 787500, color: "from-purple-600 to-purple-700" },
  { name: "Classic", members: 303, revenue: 303000, color: "from-slate-600 to-slate-700" },
];