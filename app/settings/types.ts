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
    membershipExpiryReminder: boolean;
    reminderBeforeDays: 1 | 3 | 7 | 15;
    gracePeriodAfterExpiryDays: number;
  };
  paymentSettings: {
    autoGenerateReceiptNumber: boolean;
  };
  attendanceSettings: {
    allowMultipleCheckIns: boolean;
    workingHoursStart: string;
    workingHoursEnd: string;
    checkInWindowStart: string;
    checkInWindowEnd: string;
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
    membershipExpiryReminder: true,
    reminderBeforeDays: 7,
    gracePeriodAfterExpiryDays: 3,
  },
  paymentSettings: {
    autoGenerateReceiptNumber: true,
  },
  attendanceSettings: {
    allowMultipleCheckIns: false,
    workingHoursStart: "06:00",
    workingHoursEnd: "22:00",
    checkInWindowStart: "05:30",
    checkInWindowEnd: "23:00",
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