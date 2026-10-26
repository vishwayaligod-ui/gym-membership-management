/**
 * Per-gym WhatsApp configuration resolution.
 *
 * Multi-tenant safe: each gym's WhatsApp sending identity (phone number ID)
 * comes from that gym's own GymSettings record; the Meta access token comes
 * from server-side environment variables (a single WhatsApp Business Account
 * can own multiple phone numbers — one per gym). Secrets are never sent to
 * the browser.
 */

import { prisma } from "@/lib/prisma";
import { getWhatsAppConfig, type WhatsAppConfig } from "./config";

export type GymWhatsAppResolution =
  | { configured: true; config: WhatsAppConfig }
  | { configured: false; reason: string };

export async function resolveGymWhatsAppConfig(
  gymId: string
): Promise<GymWhatsAppResolution> {
  const settings = await prisma.gymSettings.findUnique({
    where: { gymId },
    select: {
      whatsappEnabled: true,
      whatsappPhoneNumberId: true,
    },
  });

  if (!settings) {
    return { configured: false, reason: "Gym settings not found" };
  }

  if (!settings.whatsappEnabled) {
    return { configured: false, reason: "WhatsApp is disabled for this gym" };
  }

  const base = getWhatsAppConfig();
  if (!base) {
    return {
      configured: false,
      reason:
        "WhatsApp credentials are not configured in environment variables",
    };
  }

  // Gym-specific phone number ID wins; env var is the single-gym fallback.
  const phoneNumberId = settings.whatsappPhoneNumberId?.trim() || base.phoneNumberId;

  return {
    configured: true,
    config: { ...base, phoneNumberId },
  };
}
