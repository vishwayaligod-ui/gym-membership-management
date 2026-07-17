export type RenewalStatus = "Active" | "Due Soon" | "Expired";

export type RenewalMember = {
  id: number;
  name: string;
  plan: string;
  phone: string;
  expiryDate: string;
  daysRemaining: number;
  fee: number;
  status: RenewalStatus;
  avatar: string;
};

export const mockRenewals: RenewalMember[] = [
  {
    id: 1,
    name: "Riya Sharma",
    plan: "Platinum",
    phone: "+91 98765 43210",
    expiryDate: "Jul 16, 2026", // Today
    daysRemaining: 0,
    fee: 6500,
    status: "Due Soon",
    avatar: "RS",
  },
  {
    id: 2,
    name: "Aman Verma",
    plan: "Classic",
    phone: "+91 99876 54321",
    expiryDate: "Jul 19, 2026", // In 3 Days
    daysRemaining: 3,
    fee: 3000,
    status: "Due Soon",
    avatar: "AV",
  },
  {
    id: 3,
    name: "Zara Khan",
    plan: "Premium",
    phone: "+91 97654 32109",
    expiryDate: "Jul 12, 2026", // Expired 4 days ago
    daysRemaining: -4,
    fee: 4500,
    status: "Expired",
    avatar: "ZK",
  },
  {
    id: 4,
    name: "Neha Patel",
    plan: "Platinum",
    phone: "+91 96543 21098",
    expiryDate: "Aug 15, 2026", // Active, far out
    daysRemaining: 30,
    fee: 6500,
    status: "Active",
    avatar: "NP",
  },
  {
    id: 5,
    name: "Vikram Singh",
    plan: "Classic",
    phone: "+91 95432 10987",
    expiryDate: "Jul 15, 2026", // Expired 1 day ago
    daysRemaining: -1,
    fee: 3000,
    status: "Expired",
    avatar: "VS",
  },
  {
    id: 6,
    name: "Pooja Hegde",
    plan: "Premium",
    phone: "+91 94321 09876",
    expiryDate: "Jul 22, 2026", // In 6 Days
    daysRemaining: 6,
    fee: 4500,
    status: "Due Soon",
    avatar: "PH",
  },
];
