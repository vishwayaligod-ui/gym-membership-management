// ---------------------------------------------------------------------------
// Notification types – mirrors the Members module pattern.
// ---------------------------------------------------------------------------

export type Reminder = {
  id: number;
  type: "expiry" | "payment" | "birthday" | "trial";
  title: string;
  description: string;
  count: number;
  icon: string;
  color: string;
};

export type UpcomingRenewal = {
  id: number;
  memberName: string;
  planName: string;
  daysUntil: number;
  amount: number;
  avatar: string;
};

export type OverduePayment = {
  id: number;
  memberName: string;
  amount: number;
  daysOverdue: number;
  planName: string;
  avatar: string;
};

export type RecentNotification = {
  id: number;
  type: "whatsapp" | "sms" | "payment" | "renewal";
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
  read: boolean;
};

export type NotificationsResponse = {
  reminders: Reminder[];
  upcomingRenewals: UpcomingRenewal[];
  overduePayments: OverduePayment[];
  recentNotifications: RecentNotification[];
};