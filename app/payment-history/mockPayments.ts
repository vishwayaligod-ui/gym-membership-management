export type PaymentStatus = "paid" | "pending" | "failed";

export type Payment = {
  id: number;
  memberName: string;
  plan: string;
  amount: number;
  method: string;
  date: string;
  status: PaymentStatus;
  avatar: string;
};

export type PaymentSummary = {
  label: string;
  value: string;
  change: string;
  tone: string;
};

export const mockPayments: Payment[] = [
  {
    id: 1,
    memberName: "Riya Sharma",
    plan: "Platinum",
    amount: 4999,
    method: "UPI",
    date: "Jul 17, 2026",
    status: "paid",
    avatar: "RS",
  },
  {
    id: 2,
    memberName: "Vikram Singh",
    plan: "Classic",
    amount: 2499,
    method: "Credit Card",
    date: "Jul 17, 2026",
    status: "paid",
    avatar: "VS",
  },
  {
    id: 3,
    memberName: "Aman Verma",
    plan: "Classic",
    amount: 2499,
    method: "Cash",
    date: "Jul 17, 2026",
    status: "pending",
    avatar: "AV",
  },
  {
    id: 4,
    memberName: "Pooja Hegde",
    plan: "Premium",
    amount: 3499,
    method: "UPI",
    date: "Jul 16, 2026",
    status: "paid",
    avatar: "PH",
  },
  {
    id: 5,
    memberName: "Zara Khan",
    plan: "Premium",
    amount: 3499,
    method: "Net Banking",
    date: "Jul 16, 2026",
    status: "failed",
    avatar: "ZK",
  },
  {
    id: 6,
    memberName: "Rohit Mehta",
    plan: "Platinum",
    amount: 4999,
    method: "Credit Card",
    date: "Jul 15, 2026",
    status: "paid",
    avatar: "RM",
  },
  {
    id: 7,
    memberName: "Neha Kapoor",
    plan: "Basic",
    amount: 1499,
    method: "UPI",
    date: "Jul 15, 2026",
    status: "paid",
    avatar: "NK",
  },
  {
    id: 8,
    memberName: "Arjun Nair",
    plan: "Gold",
    amount: 1999,
    method: "Cash",
    date: "Jul 14, 2026",
    status: "pending",
    avatar: "AN",
  },
  {
    id: 9,
    memberName: "Sneha Patel",
    plan: "Classic",
    amount: 2499,
    method: "Net Banking",
    date: "Jul 14, 2026",
    status: "paid",
    avatar: "SP",
  },
  {
    id: 10,
    memberName: "Karan Joshi",
    plan: "Gold",
    amount: 1999,
    method: "UPI",
    date: "Jul 13, 2026",
    status: "failed",
    avatar: "KJ",
  },
  {
    id: 11,
    memberName: "Divya Menon",
    plan: "Platinum",
    amount: 4999,
    method: "Credit Card",
    date: "Jul 13, 2026",
    status: "paid",
    avatar: "DM",
  },
  {
    id: 12,
    memberName: "Manoj Tiwari",
    plan: "Basic",
    amount: 1499,
    method: "Cash",
    date: "Jul 12, 2026",
    status: "paid",
    avatar: "MT",
  },
];

export const paymentSummaryCards: PaymentSummary[] = [
  {
    label: "Today's Revenue",
    value: "₹7,498",
    change: "+18% vs yesterday",
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Weekly Revenue",
    value: "₹34,490",
    change: "+12% vs last week",
    tone: "bg-blue-50 text-blue-700",
  },
  {
    label: "Monthly Revenue",
    value: "₹1,42,800",
    change: "+8% vs last month",
    tone: "bg-indigo-50 text-indigo-700",
  },
  {
    label: "Pending Payments",
    value: "2",
    change: "₹4,498 awaiting clearance",
    tone: "bg-amber-50 text-amber-700",
  },
];