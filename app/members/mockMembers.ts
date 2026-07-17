export type MemberStatus = "Active" | "Expiring" | "Expired";

export type Member = {
  id: number;
  name: string;
  plan: string;
  phone: string;
  joinedOn: string;
  expiresOn: string;
  status: MemberStatus;
  avatar: string;
};

export const mockMembers: Member[] = [
  {
    id: 1,
    name: "Riya Sharma",
    plan: "Platinum",
    phone: "+91 98765 43210",
    joinedOn: "Jan 12, 2024",
    expiresOn: "Jul 12, 2026",
    status: "Active",
    avatar: "RS",
  },
  {
    id: 2,
    name: "Aman Verma",
    plan: "Classic",
    phone: "+91 99876 54321",
    joinedOn: "Mar 08, 2024",
    expiresOn: "Aug 08, 2026",
    status: "Expiring",
    avatar: "AV",
  },
  {
    id: 3,
    name: "Zara Khan",
    plan: "Premium",
    phone: "+91 97654 32109",
    joinedOn: "Dec 18, 2023",
    expiresOn: "Jun 18, 2026",
    status: "Expired",
    avatar: "ZK",
  },
  {
    id: 4,
    name: "Neha Patel",
    plan: "Platinum",
    phone: "+91 96543 21098",
    joinedOn: "Feb 24, 2025",
    expiresOn: "Nov 24, 2026",
    status: "Active",
    avatar: "NP",
  },
];
