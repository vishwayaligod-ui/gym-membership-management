/**
 * WhatsApp message delivery log — duplicate protection.
 *
 * Every outbound WhatsApp message (reminders, receipts) is tracked with a
 * unique `dedupeKey`. A scheduler that runs repeatedly can never resend the
 * same message: the row is claimed atomically via the unique constraint.
 * FAILED/PENDING rows may be retried (send again + update), SENT/SKIPPED
 * rows are never touched again.
 */

import { Prisma, WhatsAppMessageStatus, WhatsAppMessageType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type WhatsAppLogClaim =
  | { claimed: true; logId: string; priorAttempts: number }
  | { claimed: false; status: WhatsAppMessageStatus };

export type CreateWhatsAppLogInput = {
  gymId: string;
  branchId?: string | null;
  memberId: string;
  membershipId?: string | null;
  paymentId?: string | null;
  type: WhatsAppMessageType;
  dedupeKey: string;
  recipientPhone: string;
  templateName?: string | null;
  scheduledFor?: Date | null;
};

/**
 * Atomically claim the right to send one message. Returns claimed=false
 * when an identical message was already SENT or SKIPPED (dedupe hit).
 */
export async function claimWhatsAppLog(
  input: CreateWhatsAppLogInput
): Promise<WhatsAppLogClaim> {
  try {
    const created = await prisma.whatsAppMessageLog.create({
      data: {
        gymId: input.gymId,
        branchId: input.branchId ?? null,
        memberId: input.memberId,
        membershipId: input.membershipId ?? null,
        paymentId: input.paymentId ?? null,
        type: input.type,
        dedupeKey: input.dedupeKey,
        recipientPhone: input.recipientPhone,
        templateName: input.templateName ?? null,
        scheduledFor: input.scheduledFor ?? null,
        status: WhatsAppMessageStatus.PENDING,
        attempts: 1,
      },
      select: { id: true, attempts: true },
    });
    return { claimed: true, logId: created.id, priorAttempts: 1 };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.whatsAppMessageLog.findUnique({
        where: { dedupeKey: input.dedupeKey },
        select: { id: true, status: true, attempts: true },
      });

      if (existing && existing.status !== WhatsAppMessageStatus.PENDING && existing.status !== WhatsAppMessageStatus.FAILED) {
        return { claimed: false, status: existing.status };
      }

      // Previous attempt failed or is stuck pending — allow a retry.
      if (existing) {
        return { claimed: true, logId: existing.id, priorAttempts: existing.attempts };
      }
    }
    throw error;
  }
}

/** Record the final delivery outcome for a claimed log row. */
export async function finalizeWhatsAppLog(
  logId: string,
  outcome: {
    status: WhatsAppMessageStatus;
    sentAt?: Date | null;
    messageId?: string | null;
    error?: string | null;
    templateName?: string | null;
  }
): Promise<void> {
  await prisma.whatsAppMessageLog.update({
    where: { id: logId },
    data: {
      status: outcome.status,
      sentAt: outcome.sentAt ?? null,
      messageId: outcome.messageId ?? null,
      error: outcome.error ?? null,
      templateName: outcome.templateName ?? undefined,
    },
  });
}
