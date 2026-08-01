export type GymSettingsPayload = {
  gymInformation: {
    gymName: string;
    ownerName: string;
    email: string;
    phone: string;
    alternatePhone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    gstNumber: string;
    website: string;
    googleBusinessProfileUrl: string;
    businessHours: string;
    gymLogo: string;
  };
  branding: {
    primaryAccentColor: string;
    secondaryColor: string;
    gymLogo: string;
    favicon: string;
  };
  membershipSettings: {
    defaultMembershipDurationDays: number;
    defaultFreezeDays: number;
    allowMultipleActiveMemberships: boolean;
    autoActivateMembership: boolean;
    membershipExpiryReminder: boolean;
    reminderBeforeDays: 1 | 3 | 7 | 15;
    gracePeriodAfterExpiryDays: number;
  };
  paymentSettings: {
    currency: string;
    currencySymbol: string;
    taxPercentage: number;
    lateFee: number;
    receiptPrefix: string;
    invoicePrefix: string;
    autoGenerateReceiptNumber: boolean;
  };
  attendanceSettings: {
    allowMultipleCheckIns: boolean;
    lateArrivalThresholdMins: number;
    workingHoursStart: string;
    workingHoursEnd: string;
    checkInWindowStart: string;
    checkInWindowEnd: string;
    attendanceAutoCloseTime: string;
  };
  notificationSettings: {
    whatsappNotifications: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
    renewalReminder: boolean;
    paymentReminder: boolean;
    birthdayWishes: boolean;
    attendanceReminder: boolean;
  };
  userPreferences: {
    defaultDashboard: string;
    defaultLanguage: string;
    dateFormat: string;
    timeFormat: string;
    timezone: string;
  };
  security: {
    requirePasswordChange: boolean;
    sessionTimeoutMinutes: number;
    twoFactorAuthentication: boolean;
    loginHistoryEnabled: boolean;
  };
  backup: {
    lastBackupAt: string | null;
  };
};

export type SettingsBackupItem = {
  id: string;
  label: string | null;
  createdAt: string;
};

export type SettingsPageResponse = {
  settings: GymSettingsPayload;
  backups: SettingsBackupItem[];
};

export const defaultGymSettings: GymSettingsPayload = {
  gymInformation: {
    gymName: "",
    ownerName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    gstNumber: "",
    website: "",
    googleBusinessProfileUrl: "",
    businessHours: "Mon-Sat: 6:00 AM - 10:00 PM",
    gymLogo: "",
  },
  branding: {
    primaryAccentColor: "#2563EB",
    secondaryColor: "#0F172A",
    gymLogo: "",
    favicon: "",
  },
  membershipSettings: {
    defaultMembershipDurationDays: 90,
    defaultFreezeDays: 7,
    allowMultipleActiveMemberships: false,
    autoActivateMembership: true,
    membershipExpiryReminder: true,
    reminderBeforeDays: 7,
    gracePeriodAfterExpiryDays: 3,
  },
  paymentSettings: {
    currency: "INR",
    currencySymbol: "₹",
    taxPercentage: 0,
    lateFee: 0,
    receiptPrefix: "RCPT",
    invoicePrefix: "INV",
    autoGenerateReceiptNumber: true,
  },
  attendanceSettings: {
    allowMultipleCheckIns: false,
    lateArrivalThresholdMins: 15,
    workingHoursStart: "06:00",
    workingHoursEnd: "22:00",
    checkInWindowStart: "05:30",
    checkInWindowEnd: "23:00",
    attendanceAutoCloseTime: "23:59",
  },
  notificationSettings: {
    whatsappNotifications: false,
    smsNotifications: false,
    emailNotifications: true,
    renewalReminder: true,
    paymentReminder: true,
    birthdayWishes: false,
    attendanceReminder: false,
  },
  userPreferences: {
    defaultDashboard: "overview",
    defaultLanguage: "en",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    timezone: "Asia/Kolkata",
  },
  security: {
    requirePasswordChange: false,
    sessionTimeoutMinutes: 30,
    twoFactorAuthentication: false,
    loginHistoryEnabled: true,
  },
  backup: {
    lastBackupAt: null,
  },
};

export function cloneDefaultGymSettings(): GymSettingsPayload {
  return JSON.parse(JSON.stringify(defaultGymSettings)) as GymSettingsPayload;
}
