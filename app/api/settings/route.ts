import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { defaultGymSettings, type GymSettingsPayload } from "@/app/settings/types";
import { getPrimaryGym, mapBackupItems, toPrismaSettingsUpdate, toSettingsPayload } from "./_utils";
import { requireApiPermission } from "@/lib/auth-helpers";

const phoneRegex = /^\+?[0-9][0-9\s-]{7,14}$/;
const pincodeRegex = /^\d{4,10}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/i;

const baseUrlValidator = z
  .string()
  .trim()
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter a valid URL");

const settingsSchema: z.ZodType<GymSettingsPayload> = z.object({
  gymInformation: z.object({
    gymName: z.string().trim().min(2, "Gym name is required"),
    ownerName: z.string().trim().min(2, "Owner name is required"),
    email: z.string().trim().email("Enter a valid email"),
    phone: z.string().trim().regex(phoneRegex, "Enter a valid phone number"),
    alternatePhone: z.string().trim().optional().default(""),
    address: z.string().trim().min(5, "Address is required"),
    city: z.string().trim().min(2, "City is required"),
    state: z.string().trim().min(2, "State is required"),
    country: z.string().trim().min(2, "Country is required"),
    pincode: z.string().trim().regex(pincodeRegex, "Enter a valid pincode"),
    gstNumber: z
      .string()
      .trim()
      .optional()
      .default("")
      .refine((value) => value.length === 0 || gstRegex.test(value), "Enter a valid GST number"),
    website: z
      .string()
      .trim()
      .optional()
      .default("")
      .refine((value) => value.length === 0 || baseUrlValidator.safeParse(value).success, "Enter a valid website URL"),
    googleBusinessProfileUrl: z
      .string()
      .trim()
      .optional()
      .default("")
      .refine(
        (value) =>
          value.length === 0 ||
          (baseUrlValidator.safeParse(value).success && /google\./i.test(value)),
        "Enter a valid Google Business Profile URL"
      ),
    businessHours: z.string().trim().min(3, "Business hours are required"),
    gymLogo: z.string().optional().default(""),
  }),
  branding: z.object({
    primaryAccentColor: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid color"),
    secondaryColor: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid color"),
    gymLogo: z.string().optional().default(""),
    favicon: z.string().optional().default(""),
  }),
  membershipSettings: z.object({
    membershipExpiryReminder: z.boolean(),
    reminderBeforeDays: z.union([z.literal(1), z.literal(3), z.literal(7), z.literal(15)]),
    gracePeriodAfterExpiryDays: z.number().int().min(0).max(60),
  }),
  paymentSettings: z.object({
    autoGenerateReceiptNumber: z.boolean(),
  }),
  attendanceSettings: z.object({
    allowMultipleCheckIns: z.boolean(),
    workingHoursStart: z.string().trim().regex(/^\d{2}:\d{2}$/),
    workingHoursEnd: z.string().trim().regex(/^\d{2}:\d{2}$/),
    checkInWindowStart: z.string().trim().regex(/^\d{2}:\d{2}$/),
    checkInWindowEnd: z.string().trim().regex(/^\d{2}:\d{2}$/),
  }),
  notificationSettings: z.object({
    whatsappNotifications: z.boolean(),
    smsNotifications: z.boolean(),
    emailNotifications: z.boolean(),
    renewalReminder: z.boolean(),
    paymentReminder: z.boolean(),
    birthdayWishes: z.boolean(),
    attendanceReminder: z.boolean(),
  }),
  security: z.object({
    requirePasswordChange: z.boolean(),
    sessionTimeoutMinutes: z.number().int().min(5).max(1440),
    twoFactorAuthentication: z.boolean(),
    loginHistoryEnabled: z.boolean(),
  }),
  backup: z.object({
    lastBackupAt: z.string().nullable(),
  }),
});

function validationErrorResponse(error: z.ZodError) {
  const flattened = error.flatten();
  const firstFieldError = Object.values(flattened.fieldErrors).flat().find(Boolean);
  return NextResponse.json(
    {
      error: firstFieldError || "Invalid settings payload",
      fieldErrors: flattened.fieldErrors,
    },
    { status: 400 }
  );
}

export async function GET() {
  try {
    const access = await requireApiPermission("settings", "read");
    if (access.response) {
      return access.response;
    }

    const gym = await getPrimaryGym();
    if (!gym) {
      return NextResponse.json({ error: "No gym found" }, { status: 400 });
    }

    const backups = await prisma.gymSettingsBackup.findMany({
      where: {
        gymId: gym.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        label: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      settings: gym.settings ? toSettingsPayload(gym) : {
        ...defaultGymSettings,
        gymInformation: {
          ...defaultGymSettings.gymInformation,
          gymName: gym.name,
          email: gym.email,
          phone: gym.phone ?? "",
          address: gym.address ?? "",
          city: gym.city ?? "",
          state: gym.state ?? "",
          country: gym.country ?? defaultGymSettings.gymInformation.country,
          pincode: gym.pincode ?? "",
          gymLogo: gym.logo ?? "",
        },
      },
      backups: mapBackupItems(backups),
    });
  } catch (error) {
    console.error("Failed to load settings:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const access = await requireApiPermission("settings", "update");
    if (access.response) {
      return access.response;
    }

    const gym = await getPrimaryGym();
    if (!gym) {
      return NextResponse.json({ error: "No gym found" }, { status: 400 });
    }

    const body = (await request.json()) as { settings?: GymSettingsPayload };
    const parsed = settingsSchema.safeParse(body.settings);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const settings = parsed.data;
    const mapped = toPrismaSettingsUpdate(settings);

    await prisma.$transaction(async (tx) => {
      await tx.gym.update({
        where: { id: gym.id },
        data: {
          name: settings.gymInformation.gymName,
          email: settings.gymInformation.email,
          phone: settings.gymInformation.phone,
          logo: settings.gymInformation.gymLogo || settings.branding.gymLogo || null,
          address: settings.gymInformation.address,
          city: settings.gymInformation.city,
          state: settings.gymInformation.state,
          country: settings.gymInformation.country,
          pincode: settings.gymInformation.pincode,
        },
      });

      await tx.gymSettings.upsert({
        where: {
          gymId: gym.id,
        },
        create: {
          ...mapped,
          gymId: gym.id,
        },
        update: {
          ...mapped,
        },
      });
    });

    const refreshedGym = await getPrimaryGym();
    if (!refreshedGym) {
      return NextResponse.json({ error: "Failed to refresh settings" }, { status: 500 });
    }

    const backups = await prisma.gymSettingsBackup.findMany({
      where: {
        gymId: refreshedGym.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        label: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      settings: toSettingsPayload(refreshedGym),
      backups: mapBackupItems(backups),
      message: "Settings saved successfully",
    });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
