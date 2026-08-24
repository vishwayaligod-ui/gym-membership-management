import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { GymSettingsPayload } from "@/app/settings/types";
import { getPrimaryGym, mapBackupItems, toPrismaSettingsUpdate, toSettingsPayload } from "../_utils";
import { requireApiPermission } from "@/lib/auth-helpers";

const createBackupSchema = z.object({
  label: z.string().trim().max(80).optional(),
});

const restoreBackupSchema = z.object({
  backupId: z.string().uuid(),
});

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
      take: 25,
      select: {
        id: true,
        label: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ backups: mapBackupItems(backups) });
  } catch (error) {
    console.error("Failed to fetch backups:", error);
    return NextResponse.json({ error: "Failed to fetch backups" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireApiPermission("settings", "create");
    if (access.response) {
      return access.response;
    }

    const gym = await getPrimaryGym();
    if (!gym) {
      return NextResponse.json({ error: "No gym found" }, { status: 400 });
    }

    const body = (await request.json()) as { label?: string };
    const parsed = createBackupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid backup label" }, { status: 400 });
    }

    const snapshot = toSettingsPayload(gym);

    await prisma.$transaction(async (tx) => {
      await tx.gymSettingsBackup.create({
        data: {
          gymId: gym.id,
          label: parsed.data.label || null,
          snapshot,
        },
      });

      await tx.gymSettings.upsert({
        where: {
          gymId: gym.id,
        },
        create: {
          ...toPrismaSettingsUpdate(snapshot),
          gymId: gym.id,
          lastBackupAt: new Date(),
        },
        update: {
          lastBackupAt: new Date(),
        },
      });
    });

    const backups = await prisma.gymSettingsBackup.findMany({
      where: {
        gymId: gym.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 25,
      select: {
        id: true,
        label: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      backups: mapBackupItems(backups),
      message: "Backup created successfully",
    });
  } catch (error) {
    console.error("Failed to create backup:", error);
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireApiPermission("settings", "update");
    if (access.response) {
      return access.response;
    }

    const gym = await getPrimaryGym();
    if (!gym) {
      return NextResponse.json({ error: "No gym found" }, { status: 400 });
    }

    const body = (await request.json()) as { backupId?: string };
    const parsed = restoreBackupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid backup ID" }, { status: 400 });
    }

    const backup = await prisma.gymSettingsBackup.findFirst({
      where: {
        id: parsed.data.backupId,
        gymId: gym.id,
      },
      select: {
        snapshot: true,
      },
    });

    if (!backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    const snapshot = backup.snapshot as GymSettingsPayload;
    const mapped = toPrismaSettingsUpdate(snapshot);

    await prisma.$transaction(async (tx) => {
      await tx.gym.update({
        where: {
          id: gym.id,
        },
        data: {
          name: snapshot.gymInformation.gymName,
          email: snapshot.gymInformation.email,
          phone: snapshot.gymInformation.phone,
          logo: snapshot.gymInformation.gymLogo || snapshot.branding.gymLogo || null,
          address: snapshot.gymInformation.address,
          city: snapshot.gymInformation.city,
          state: snapshot.gymInformation.state,
          country: snapshot.gymInformation.country,
          pincode: snapshot.gymInformation.pincode,
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
        gymId: gym.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 25,
      select: {
        id: true,
        label: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      settings: toSettingsPayload(refreshedGym),
      backups: mapBackupItems(backups),
      message: "Backup restored successfully",
    });
  } catch (error) {
    console.error("Failed to restore backup:", error);
    return NextResponse.json({ error: "Failed to restore backup" }, { status: 500 });
  }
}
