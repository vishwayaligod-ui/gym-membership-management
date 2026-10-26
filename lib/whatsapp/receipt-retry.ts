/**
 * Retry delivery of FAILED WhatsApp renewal receipts.
 *
 * A renewal/payment receipt is delivered fire-and-forget (see receipts.ts).
 * When delivery definitively fails (PDF upload failure or a rejected Meta
 * request) the WhatsAppMessageLog row is left FAILED. This module is the
 * missing automatic retry path for those rows.
 *
 * Safety model:
 * - FAILED only: a FAILED row is only ever written for a *definite* failure
 *   (pre-send upload failure, or Meta returned a non-2xx / no message id), so
 *   resending cannot duplicate an already-delivered receipt.
 * - PENDING is NEVER retried: a stuck PENDING row may mean "Meta accepted the
 *   message but we crashed before writing SENT" — retrying it would duplicate.
 * - SENT / SKIPPED are terminal and are never selected.
 * - Bounded: at most MAX_ATTEMPTS per receipt and only receipts created within
 *   RETRY_WINDOW_HOURS.
 * - Concurrency-safe: every retry is claimed with an atomic updateMany guarded
 *   by status + attempts + a 15-minute lease on updatedAt, so two overlapping
 *   cron runs can never resend the same receipt.
 *
 * The retry reuses the EXISTING log row and dedupe key — it never inserts a
 * second row. On success the existing flow finalizes the row as SENT, and
 * because SENT is terminal it can never be sent twice.
 */

import { WhatsAppMessageStatus, WhatsAppMessageType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendRenewalReceiptWhatsApp } from "./receipts";

export const MAX_ATTEMPTS = 3;
export const RETRY_WINDOW_HOURS = 48;
export const LEASE_MINUTES = 15;
export const BATCH_LIMIT = 25;

export type ReceiptRetrySummary = {
  considered: number;
  retried: number;
  sent: number;
  failed: number;
  skipped: number;
};

/**
 * Retry FAILED renewal-receipt deliveries. Never throws: every error is
 * isolated per receipt (and the whole run is wrapped) so a single bad receipt
 * cannot abort the batch or fail the cron request.
 */
export async function retryFailedReceipts(
  options: { now?: Date; limit?: number } = {}
): Promise<ReceiptRetrySummary> {
  const now = options.now ?? new Date();
  const limit = options.limit ?? BATCH_LIMIT;

  const summary: ReceiptRetrySummary = {
    considered: 0,
    retried: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  try {
    const windowStart = new Date(
      now.getTime() - RETRY_WINDOW_HOURS * 60 * 60 * 1000
    );

    // Only definitively-failed receipts can be retried. PENDING/SENT/SKIPPED
    // are intentionally excluded.
    const candidates = await prisma.whatsAppMessageLog.findMany({
      where: {
        type: WhatsAppMessageType.RENEWAL_RECEIPT,
        status: WhatsAppMessageStatus.FAILED,
        paymentId: { not: null },
        attempts: { lt: MAX_ATTEMPTS },
        createdAt: { gte: windowStart },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: { id: true, paymentId: true },
    });

    summary.considered = candidates.length;

    for (const candidate of candidates) {
      try {
        const paymentId = candidate.paymentId;
        if (!paymentId) {
          summary.skipped += 1;
          continue;
        }

        // Atomic, concurrency-safe retry claim. Reuses the existing row and
        // dedupe key. Attempts is incremented here — claimWhatsAppLog() itself
        // never increments it.
        const leaseCutoff = new Date(
          now.getTime() - LEASE_MINUTES * 60 * 1000
        );

        const claim = await prisma.whatsAppMessageLog.updateMany({
          where: {
            id: candidate.id,
            status: WhatsAppMessageStatus.FAILED,
            attempts: { lt: MAX_ATTEMPTS },
            updatedAt: { lt: leaseCutoff },
          },
          data: {
            attempts: { increment: 1 },
          },
        });

        // Another worker already claimed it, or it is no longer eligible.
        if (claim.count !== 1) {
          summary.skipped += 1;
          continue;
        }

        summary.retried += 1;

        // Reuse the existing receipt flow. It re-claims the same log row via
        // the shared dedupe key and finalizes it as SENT or FAILED. It never
        // throws into this loop.
        const result = await sendRenewalReceiptWhatsApp({ paymentId });

        if (result.success) {
          summary.sent += 1;
        } else {
          summary.failed += 1;
        }
      } catch (error) {
        summary.failed += 1;
        console.error(
          `[WhatsApp] Receipt retry failed for log ${candidate.id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("[WhatsApp] Receipt retry run failed:", error);
  }

  return summary;
}
