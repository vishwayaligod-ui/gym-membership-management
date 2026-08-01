export type AttendanceStatus = "Present" | "Late" | "Absent";

export type AttendanceRecord = {
  id: string;
  memberId: string;
  name: string;
  avatar: string;
  plan: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  status?: AttendanceStatus;
};

export type CheckInMemberStatus =
  | "Active"
  | "Expiring"
  | "Expired"
  | "Pending"
  | "Inactive"
  | "Frozen";

export type CheckInMember = {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  plan: string;
  membershipId: string;
  membershipExpiry: string;
  membershipStatus: CheckInMemberStatus;
  lastVisit: string;
  todayCheckedIn: boolean;
  todayCheckInTime: string | null;
  todayCheckOutTime: string | null;
};

export type RecentActivityItem = {
  id: string;
  action: "checked_in" | "checked_out";
  memberName: string;
  memberAvatar: string;
  time: string;
  timestamp: number;
};
