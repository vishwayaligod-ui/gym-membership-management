import { prisma } from "@/lib/prisma";
import { Prisma, type Gym, type GymSettings } from "@prisma/client";
import {
  cloneDefaultGymSettings,
  type GymSettingsPayload,
  type SettingsBackupItem,
} from "@/app/settings/types";

type GymWithSettings = Gym & {
  settings: GymSettings | null;
};

export async function getPrimaryGym() {
  return prisma.gym.findFirst({
    include: {
      settings: true,
    },
  });
}

export function toSettingsPayload(record: GymWithSettings): GymSettingsPayload {
  const defaults = cloneDefaultGymSettings();
  const settings = record.settings;

  return {
    gymInformation: {
      gymName: settings?.gymName ?? record.name,
      ownerName: settings?.ownerName ?? "",
      email: settings?.email ?? record.email,
      phone: settings?.phone ?? record.phone ?? "",
      alternatePhone: settings?.alternatePhone ?? "",
      address: settings?.address ?? record.address ?? "",
      city: settings?.city ?? record.city ?? "",
      state: settings?.state ?? record.state ?? "",
      country: settings?.country ?? record.country ?? defaults.gymInformation.country,
      pincode: settings?.pincode ?? record.pincode ?? "",
      gstNumber: settings?.gstNumber ?? "",
      website: settings?.website ?? "",
      googleBusinessProfileUrl: settings?.googleBusinessProfileUrl ?? "",
      businessHours: settings?.businessHours ?? defaults.gymInformation.businessHours,
      gymLogo: settings?.gymLogo ?? record.logo ?? "",
    },
    branding: {
      primaryAccentColor: settings?.primaryAccentColor ?? defaults.branding.primaryAccentColor,
      secondaryColor: settings?.secondaryColor ?? defaults.branding.secondaryColor,
      gymLogo: settings?.brandingLogo ?? settings?.gymLogo ?? record.logo ?? "",
      favicon: settings?.favicon ?? "",
    },
    membershipSettings: {
      defaultMembershipDurationDays:
        settings?.defaultMembershipDurationDays ??
        defaults.membershipSettings.defaultMembershipDurationDays,
      defaultFreezeDays: settings?.defaultFreezeDays ?? defaults.membershipSettings.defaultFreezeDays,
      allowMultipleActiveMemberships:
        settings?.allowMultipleActiveMemberships ??
        defaults.membershipSettings.allowMultipleActiveMemberships,
      autoActivateMembership:
        settings?.autoActivateMembership ?? defaults.membershipSettings.autoActivateMembership,
      membershipExpiryReminder:
        settings?.membershipExpiryReminder ?? defaults.membershipSettings.membershipExpiryReminder,
      reminderBeforeDays:
        (settings?.reminderBeforeDays as 1 | 3 | 7 | 15) ??
        defaults.membershipSettings.reminderBeforeDays,
      gracePeriodAfterExpiryDays:
        settings?.gracePeriodAfterExpiryDays ??
        defaults.membershipSettings.gracePeriodAfterExpiryDays,
    },
    paymentSettings: {
      currency: settings?.currency ?? record.currency,
      currencySymbol: settings?.currencySymbol ?? defaults.paymentSettings.currencySymbol,
      taxPercentage: settings ? Number(settings.taxPercentage) : defaults.paymentSettings.taxPercentage,
      lateFee: settings ? Number(settings.lateFee) : defaults.paymentSettings.lateFee,
      receiptPrefix: settings?.receiptPrefix ?? defaults.paymentSettings.receiptPrefix,
      invoicePrefix: settings?.invoicePrefix ?? defaults.paymentSettings.invoicePrefix,
      autoGenerateReceiptNumber:
        settings?.autoGenerateReceiptNumber ?? defaults.paymentSettings.autoGenerateReceiptNumber,
    },
    attendanceSettings: {
      allowMultipleCheckIns:
        settings?.allowMultipleCheckIns ?? defaults.attendanceSettings.allowMultipleCheckIns,
      lateArrivalThresholdMins:
        settings?.lateArrivalThresholdMins ?? defaults.attendanceSettings.lateArrivalThresholdMins,
      workingHoursStart: settings?.workingHoursStart ?? defaults.attendanceSettings.workingHoursStart,
      workingHoursEnd: settings?.workingHoursEnd ?? defaults.attendanceSettings.workingHoursEnd,
      checkInWindowStart: settings?.checkInWindowStart ?? defaults.attendanceSettings.checkInWindowStart,
      checkInWindowEnd: settings?.checkInWindowEnd ?? defaults.attendanceSettings.checkInWindowEnd,
      attendanceAutoCloseTime:
        settings?.attendanceAutoCloseTime ?? defaults.attendanceSettings.attendanceAutoCloseTime,
    },
    notificationSettings: {
      whatsappNotifications:
        settings?.whatsappNotifications ?? defaults.notificationSettings.whatsappNotifications,
      smsNotifications: settings?.smsNotifications ?? defaults.notificationSettings.smsNotifications,
      emailNotifications:
        settings?.emailNotifications ?? defaults.notificationSettings.emailNotifications,
      renewalReminder: settings?.renewalReminder ?? defaults.notificationSettings.renewalReminder,
      paymentReminder: settings?.paymentReminder ?? defaults.notificationSettings.paymentReminder,
      birthdayWishes: settings?.birthdayWishes ?? defaults.notificationSettings.birthdayWishes,
      attendanceReminder:
        settings?.attendanceReminder ?? defaults.notificationSettings.attendanceReminder,
    },
    userPreferences: {
      defaultDashboard: settings?.defaultDashboard ?? defaults.userPreferences.defaultDashboard,
      defaultLanguage: settings?.defaultLanguage ?? defaults.userPreferences.defaultLanguage,
      dateFormat: settings?.dateFormat ?? defaults.userPreferences.dateFormat,
      timeFormat: settings?.timeFormat ?? defaults.userPreferences.timeFormat,
      timezone: settings?.timezone ?? record.timezone,
    },
    security: {
      requirePasswordChange:
        settings?.requirePasswordChange ?? defaults.security.requirePasswordChange,
      sessionTimeoutMinutes:
        settings?.sessionTimeoutMinutes ?? defaults.security.sessionTimeoutMinutes,
      twoFactorAuthentication:
        settings?.twoFactorAuthentication ?? defaults.security.twoFactorAuthentication,
      loginHistoryEnabled: settings?.loginHistoryEnabled ?? defaults.security.loginHistoryEnabled,
    },
    backup: {
      lastBackupAt: settings?.lastBackupAt?.toISOString() ?? null,
    },
  };
}

export function mapBackupItems(
  backups: Array<{ id: string; label: string | null; createdAt: Date }>
): SettingsBackupItem[] {
  return backups.map((backup) => ({
    id: backup.id,
    label: backup.label,
    createdAt: backup.createdAt.toISOString(),
  }));
}

export function toPrismaSettingsUpdate(payload: GymSettingsPayload): Prisma.GymSettingsUncheckedCreateInput {
  return {
    gymId: "",
    gymName: payload.gymInformation.gymName,
    ownerName: payload.gymInformation.ownerName,
    email: payload.gymInformation.email,
    phone: payload.gymInformation.phone,
    alternatePhone: payload.gymInformation.alternatePhone || null,
    address: payload.gymInformation.address,
    city: payload.gymInformation.city,
    state: payload.gymInformation.state,
    country: payload.gymInformation.country,
    pincode: payload.gymInformation.pincode,
    gstNumber: payload.gymInformation.gstNumber || null,
    website: payload.gymInformation.website || null,
    googleBusinessProfileUrl: payload.gymInformation.googleBusinessProfileUrl || null,
    businessHours: payload.gymInformation.businessHours,
    gymLogo: payload.gymInformation.gymLogo || null,
    primaryAccentColor: payload.branding.primaryAccentColor,
    secondaryColor: payload.branding.secondaryColor,
    brandingLogo: payload.branding.gymLogo || null,
    favicon: payload.branding.favicon || null,
    defaultMembershipDurationDays: payload.membershipSettings.defaultMembershipDurationDays,
    defaultFreezeDays: payload.membershipSettings.defaultFreezeDays,
    allowMultipleActiveMemberships: payload.membershipSettings.allowMultipleActiveMemberships,
    autoActivateMembership: payload.membershipSettings.autoActivateMembership,
    membershipExpiryReminder: payload.membershipSettings.membershipExpiryReminder,
    reminderBeforeDays: payload.membershipSettings.reminderBeforeDays,
    gracePeriodAfterExpiryDays: payload.membershipSettings.gracePeriodAfterExpiryDays,
    currency: payload.paymentSettings.currency,
    currencySymbol: payload.paymentSettings.currencySymbol,
    taxPercentage: new Prisma.Decimal(payload.paymentSettings.taxPercentage),
    lateFee: new Prisma.Decimal(payload.paymentSettings.lateFee),
    receiptPrefix: payload.paymentSettings.receiptPrefix,
    invoicePrefix: payload.paymentSettings.invoicePrefix,
    autoGenerateReceiptNumber: payload.paymentSettings.autoGenerateReceiptNumber,
    allowMultipleCheckIns: payload.attendanceSettings.allowMultipleCheckIns,
    lateArrivalThresholdMins: payload.attendanceSettings.lateArrivalThresholdMins,
    workingHoursStart: payload.attendanceSettings.workingHoursStart,
    workingHoursEnd: payload.attendanceSettings.workingHoursEnd,
    checkInWindowStart: payload.attendanceSettings.checkInWindowStart,
    checkInWindowEnd: payload.attendanceSettings.checkInWindowEnd,
    attendanceAutoCloseTime: payload.attendanceSettings.attendanceAutoCloseTime,
    whatsappNotifications: payload.notificationSettings.whatsappNotifications,
    smsNotifications: payload.notificationSettings.smsNotifications,
    emailNotifications: payload.notificationSettings.emailNotifications,
    renewalReminder: payload.notificationSettings.renewalReminder,
    paymentReminder: payload.notificationSettings.paymentReminder,
    birthdayWishes: payload.notificationSettings.birthdayWishes,
    attendanceReminder: payload.notificationSettings.attendanceReminder,
    defaultDashboard: payload.userPreferences.defaultDashboard,
    defaultLanguage: payload.userPreferences.defaultLanguage,
    dateFormat: payload.userPreferences.dateFormat,
    timeFormat: payload.userPreferences.timeFormat,
    timezone: payload.userPreferences.timezone,
    requirePasswordChange: payload.security.requirePasswordChange,
    sessionTimeoutMinutes: payload.security.sessionTimeoutMinutes,
    twoFactorAuthentication: payload.security.twoFactorAuthentication,
    loginHistoryEnabled: payload.security.loginHistoryEnabled,
    lastBackupAt: payload.backup.lastBackupAt ? new Date(payload.backup.lastBackupAt) : null,
  };
}
