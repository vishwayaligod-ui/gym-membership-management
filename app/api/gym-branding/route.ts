import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { defaultGymSettings } from "@/app/settings/types";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gym = await prisma.gym.findFirst({
      include: { settings: true },
    });

    if (!gym) {
      return NextResponse.json({
        gymName: "",
        gymLogo: "",
        primaryAccentColor: defaultGymSettings.branding.primaryAccentColor,
        secondaryColor: defaultGymSettings.branding.secondaryColor,
      });
    }

    const settings = gym.settings;
    const gymName = settings?.gymName ?? gym.name;
    const gymLogo = settings?.brandingLogo ?? settings?.gymLogo ?? gym.logo ?? "";
    const primaryAccentColor =
      settings?.primaryAccentColor ?? defaultGymSettings.branding.primaryAccentColor;
    const secondaryColor =
      settings?.secondaryColor ?? defaultGymSettings.branding.secondaryColor;

    return NextResponse.json({ gymName, gymLogo, primaryAccentColor, secondaryColor });
  } catch (error) {
    console.error("Failed to load gym branding:", error);
    return NextResponse.json(
      {
        gymName: "",
        gymLogo: "",
        primaryAccentColor: defaultGymSettings.branding.primaryAccentColor,
        secondaryColor: defaultGymSettings.branding.secondaryColor,
      },
      { status: 500 }
    );
  }
}