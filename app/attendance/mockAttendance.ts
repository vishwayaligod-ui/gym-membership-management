export type AttendanceStatus = "Present" | "Checked Out" | "Pending";

export type AttendanceMember = {
  id: number;
  name: string;
  plan: string;
  avatar: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: AttendanceStatus;
};

export const mockAttendance: AttendanceMember[] = [
  {
    id: 1,
    name: "Riya Sharma",
    plan: "Platinum",
    avatar: "RS",
    checkInTime: "08:12 AM",
    checkOutTime: null,
    status: "Present",
  },
  {
    id: 2,
    name: "Aman Verma",
    plan: "Classic",
    avatar: "AV",
    checkOutTime: "09:42 AM",
    checkInTime: "07:55 AM",
    status: "Checked Out",
  },
  {
    id: 3,
    name: "Zara Khan",
    plan: "Premium",
    avatar: "ZK",
    checkInTime: "09:30 AM",
    checkOutTime: null,
    status: "Pending",
  },
];

export const mockActivity = [
  { time: "09:05 AM", name: "Riya Sharma", action: "Checked In" },
  { time: "09:42 AM", name: "Aman Verma", action: "Checked Out" },
  { time: "10:00 AM", name: "Zara Khan", action: "Checked In" },
];
