/**
 * Automated WhatsApp renewal reminders (7 days and 3 days before expiry).
 *
 * - Multi-gym safe: iterates ACTIVE gyms, all queries are gym-scoped, and
 *   each gym's own WhatsApp configuration (GymSettings) is used.
 * - Duplicate-safe: every send is claimed via a unique WhatsAppMessageLog
 *   dedupeKey of the shape
 *   `whatsapp:reminder:{TYPE}:{membershipId}:{expiryDate}` — repeated
 *   scheduler runs can never resend the same reminder.
 * - Idempotent and safe to run many times per day.
 */

import {
  MemberStatus,
  MembershipStatus,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  addDaysToDateString,
  formatUtcDateForDisplay,
  getDateStringInTimeZone,
  getUtcDayRange,
} from "@/lib/datetime";
import { resolveGymWhatsAppConfig } from "./gym-config";
import { claimWhatsAppLog, finalizeWhatsAppLog } from "./message-log";
import { sendWhatsAppTemplateMessage } from "./service";
import { normalizeIndianPhoneNumber } from "./phone";
import type { WhatsAppTemplateName } from "./templates";

export type ReminderRunSummary = {
  ranAt: string;
  gymsConsidered: number;
  gymsSkipped: Array<{ gymId: string; reason: string }>;
  reminders7Days: { selected: number; sent: number; failed: number; alreadySent: number };
  reminders3Days: { selected: number; sent: number; failed: number; alreadySent: number };
};

const REMINDER_OFFSETS = [
  {
    days: 7,
    type: WhatsAppMessageType.RENEWAL_REMINDER_7_DAYS,
    template: "RENEWAL_REMINDER" as WhatsAppTemplateName,
  },
  {
    days: 3,
    type: WhatsAppMessageType.RENEWAL_REMINDER_3_DAYS,
    template: "RENEWAL_REMINDER_3_DAYS" as WhatsAppTemplateName,
  },
];

export async function runRenewalReminders(
  options: { gymId?: string; now?: Date } = {}
): Promise<ReminderRunSummary> {
  const now = options.now ?? new Date();

  const gyms = await prisma.gym.findMany({
    where: {
      status: "ACTIVE",
      ...(options.gymId ? { id: options.gymId } : {}),
    },
    include: {
      settings: {
        select: {
          whatsappEnabled: true,
          membershipExpiryReminder: true,
        },
      },
    },
  });

  const summary: ReminderRunSummary = {
    ranAt: now.toISOString(),
    gymsConsidered: gyms.length,
    gymsSkipped: [],
    reminders7Days: { selected: 0, sent: 0, failed: 0, alreadySent: 0 },
    reminders3Days: { selected: 0, sent: 0, failed: 0, alreadySent: 0 },
  };

  for (const gym of gyms) {
    if (!gym.settings?.whatsappEnabled) {
      summary.gymsSkipped.push({ gymId: gym.id, reason: "WhatsApp is disabled for this gym" });
      continue;
    }
    if (gym.settings.membershipExpiryReminder === false) {
      summary.gymsSkipped.push({ gymId: gym.id, reason: "Membership expiry reminders are disabled" });
      continue;
    }

    const resolution = await resolveGymWhatsAppConfig(gym.id);
    if (!resolution.configured) {
      summary.gymsSkipped.push({ gymId: gym.id, reason: resolution.reason });
      continue;
    }
    const config = resolution.config;

    // "Today" on the gym's own calendar (timezone-aware).
    const todayStr = getDateStringInTimeZone(now, gym.timezone || "Asia/Kolkata");

    await processReminderOffsets(gym, config, todayStr, summary);
  }

  return summary;
}
async function processReminderOffsets(
  gym: {
    id: string;
    name: string;
  },
  config: { accessToken: string; phoneNumberId: string; apiVersion: string; webhookVerifyToken: string },
  todayStr: string,
  summary: ReminderRunSummary
): Promise<void> {
  for (const offset of REMINDER_OFFSETS) {
    const targetDateStr = addDaysToDateString(todayStr, offset.days);
    const range = getUtcDayRange(targetDateStr);

    const memberships = await prisma.membership.findMany({
      where: {
        gymId: gym.id,
        status: MembershipStatus.ACTIVE,
        endDate: { gte: range.start, lt: range.end },
        member: {
          status: MemberStatus.ACTIVE,
        },
      },
      select: {
        id: true,
        gymId: true,
        branchId: true,
        endDate: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        plan: {
          select: { name: true },
        },
      },
    });

    const bucket =
      offset.days === 7 ? summary.reminders7Days : summary.reminders3Days;
    bucket.selected += memberships.length;

    for (const membership of memberships) {
      const member = membership.member;
      const memberName = `${member.firstName} ${member.lastName || ""}`.trim();

      const dedupeKey = `whatsapp:reminder:${offset.type}:${membership.id}:${targetDateStr}`;
      const recipientPhone =
        normalizeIndianPhoneNumber(member.phone) ?? member.phone;

      const claim = await claimWhatsAppLog({
        gymId: gym.id,
        branchId: membership.branchId,
        memberId: member.id,
        membershipId: membership.id,
        type: offset.type,
        dedupeKey,
        recipientPhone,
        templateName: offset.template,
        scheduledFor: membership.endDate,
      });

      if (!claim.claimed) {
        bucket.alreadySent += 1;
        continue;
      }

      const result = await sendWhatsAppTemplateMessage({
        to: member.phone,
        templateName: offset.template,
        variables: {
          member_name: memberName,
          plan_name: membership.plan.name,
          expiry_date: formatUtcDateForDisplay(membership.endDate),
          gym_name: gym.name,
        },
        config,
      });

      if (result.success) {
        bucket.sent += 1;
        await finalizeWhatsAppLog(claim.logId, {
          status: WhatsAppMessageStatus.SENT,
          sentAt: new Date(),
          messageId: result.messageId,
          error: null,
        });
      } else {
        bucket.failed += 1;
        await finalizeWhatsAppLog(claim.logId, {
          status: WhatsAppMessageStatus.FAILED,
          error: result.error,
        });
      }
    }
  }
}


