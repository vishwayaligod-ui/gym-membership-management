/**
 * Automatic PDF bill/receipt delivery over WhatsApp after a successful
 * renewal/payment.
 *
 * Flow (never breaks the payment flow — see FAILURE HANDLING):
 *   1. Load the payment with its gym-scoped relations.
 *   2. Resolve the gym's own WhatsApp configuration.
 *   3. Generate the PDF receipt (pdf-lib) from existing business data.
 *   4. Upload the PDF to WhatsApp Cloud API and send it as an actual
 *      document (template with DOCUMENT header; free-form document with a
 *      success caption as fallback).
 *   5. Record the delivery outcome in WhatsAppMessageLog.
 *
 * Duplicate protection: one receipt per payment via dedupeKey
 * `whatsapp:receipt:{paymentId}`.
 *
 * WhatsApp failures NEVER fail the renewal/payment — they are only logged.
 */

import { PaymentStatus, WhatsAppMessageStatus, WhatsAppMessageType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveGymWhatsAppConfig } from "./gym-config";
import { claimWhatsAppLog, finalizeWhatsAppLog } from "./message-log";
import {
  sendWhatsAppDocumentMessage,
  sendWhatsAppTemplateDocumentMessage,
  uploadWhatsAppMedia,
} from "./service";
import { normalizeIndianPhoneNumber } from "./phone";
import { buildReceiptFilename, buildRenewalReceiptPdf } from "@/lib/pdf/renewal-receipt";
import { formatReceiptAmount } from "@/lib/pdf/renewal-receipt";

export type RenewalReceiptResult =
  | { success: true; messageId: string; alreadySent?: boolean }
  | { success: false; error: string; skipped?: boolean };

export async function sendRenewalReceiptWhatsApp(options: {
  paymentId: string;
}): Promise<RenewalReceiptResult> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: options.paymentId },
      include: {
        member: true,
        membership: {
          include: { plan: true },
        },
        gym: {
          include: { settings: true },
        },
      },
    });

    if (!payment) {
      return { success: false, error: "Payment not found for receipt delivery", skipped: true };
    }

    // Only successful payments get a receipt.
    if (payment.paymentStatus !== PaymentStatus.PAID) {
      return {
        success: false,
        error: `Payment status is ${payment.paymentStatus}; receipt is only sent for PAID payments`,
        skipped: true,
      };
    }

    const gym = payment.gym;
    const member = payment.member;
    const membership = payment.membership;

    if (!membership) {
      return { success: false, error: "Payment has no linked membership", skipped: true };
    }

    const resolution = await resolveGymWhatsAppConfig(gym.id);
    if (!resolution.configured) {
      // Record once per payment for investigation; do NOT touch the payment.
      await recordSkippedReceipt(payment, resolution.reason);
      return { success: false, error: resolution.reason, skipped: true };
    }
    const config = resolution.config;

    const memberName = `${member.firstName} ${member.lastName || ""}`.trim();

    const claim = await claimWhatsAppLog({
      gymId: gym.id,
      branchId: payment.branchId,
      memberId: member.id,
      membershipId: membership.id,
      paymentId: payment.id,
      type: WhatsAppMessageType.RENEWAL_RECEIPT,
      dedupeKey: `whatsapp:receipt:${payment.id}`,
      recipientPhone: normalizeIndianPhoneNumber(member.phone) ?? member.phone,
      templateName: "RENEWAL_RECEIPT",
    });

    if (!claim.claimed) {
      return { success: true, messageId: "", alreadySent: true };
    }

    const receiptNumber = payment.transactionId?.trim() || `RCPT-${payment.id.slice(-8).toUpperCase()}`;
    const filename = buildReceiptFilename(memberName, payment.paymentDate);
    const successCaption = `Hi ${memberName}, your membership renewal payment of ${formatReceiptAmount(
      Number(payment.amount)
    )} has been successfully received. Please find your renewal receipt attached.`;
    // Amount already received on this membership before this payment. This
    // mirrors the balance convention used by the members list/detail screens.
    // Read-only and self-contained: a failure here can never affect the
    // payment flow, and the PDF simply prints "Already Paid" as 0.
    let alreadyPaidBefore = 0;
    try {
      const collected = await prisma.payment.aggregate({
        where: { membershipId: membership.id, id: { not: payment.id } },
        _sum: { amount: true },
      });
      alreadyPaidBefore = Number(collected._sum.amount ?? 0);
    } catch (aggregateError) {
      console.error(
        "[WhatsApp] Could not total earlier membership payments:",
        aggregateError
      );
    }

    // 1. Generate the PDF receipt from existing business data.
    const pdfBytes = await buildRenewalReceiptPdf({
      gymName: gym.name,
      gymPhone: gym.phone,
      gymEmail: gym.email,
      gymAddress:
        [gym.address, gym.city, gym.state, gym.pincode].filter(Boolean).join(", ") ||
        gym.settings?.address ||
        null,
      gymLogo: gym.settings?.brandingLogo || gym.settings?.gymLogo || null,
      memberName,
      memberPhone: member.phone,
      memberCode: member.memberCode,
      planName: membership.plan.name,
      renewalDate: payment.paymentDate,
      startDate: membership.startDate,
      endDate: membership.endDate,
      amount: Number(membership.amount),
      discount: Number(membership.discount),
      finalAmount: Number(membership.finalAmount),
      paidAmount: Number(payment.amount),
      alreadyPaidBefore,
      paymentMode: payment.paymentMode,
      paymentStatus: payment.paymentStatus,
      receiptNumber,
      transactionId: payment.transactionId,
    });

    // 2. Upload the actual PDF to WhatsApp Cloud API.
    const upload = await uploadWhatsAppMedia({
      config,
      file: pdfBytes,
      mimeType: "application/pdf",
      filename,
    });

    if (!upload.success) {
      await finalizeWhatsAppLog(claim.logId, {
        status: WhatsAppMessageStatus.FAILED,
        error: `PDF upload failed: ${upload.error}`,
      });
      return { success: false, error: `PDF upload failed: ${upload.error}` };
    }

    // 3. Send the PDF document. Primary: approved template with a DOCUMENT
    //    header. Fallback: free-form document message with the success text.
    let result = await sendWhatsAppTemplateDocumentMessage({
      config,
      to: member.phone,
      templateName: "RENEWAL_RECEIPT",
      variables: {
        member_name: memberName,
        amount: formatReceiptAmount(Number(payment.amount)),
        receipt_number: receiptNumber,
        gym_name: gym.name,
      },
      documentMediaId: upload.mediaId,
      documentFilename: filename,
    });

    let usedTemplate: string = "RENEWAL_RECEIPT";

    if (!result.success) {
      result = await sendWhatsAppDocumentMessage({
        config,
        to: member.phone,
        mediaId: upload.mediaId,
        filename,
        caption: successCaption,
      });
      usedTemplate = "FREEFORM_DOCUMENT";
    }

    if (result.success) {
      await finalizeWhatsAppLog(claim.logId, {
        status: WhatsAppMessageStatus.SENT,
        sentAt: new Date(),
        messageId: result.messageId,
        error: null,
        templateName: usedTemplate,
      });
      return { success: true, messageId: result.messageId };
    }

    await finalizeWhatsAppLog(claim.logId, {
      status: WhatsAppMessageStatus.FAILED,
      error: result.error,
      templateName: usedTemplate,
    });
    return { success: false, error: result.error };
  } catch (error) {
    // FAILURE HANDLING: receipt delivery must never throw into the payment
    // flow. Record and swallow.
    console.error("[WhatsApp] Renewal receipt delivery failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown receipt delivery error",
    };
  }
}

async function recordSkippedReceipt(
  payment: {
    id: string;
    gymId: string;
    branchId: string;
    memberId: string;
    membershipId: string;
  },
  reason: string
): Promise<void> {
  try {
    await claimWhatsAppLog({
      gymId: payment.gymId,
      branchId: payment.branchId,
      memberId: payment.memberId,
      membershipId: payment.membershipId,
      paymentId: payment.id,
      type: WhatsAppMessageType.RENEWAL_RECEIPT,
      dedupeKey: `whatsapp:receipt:${payment.id}`,
      recipientPhone: "",
      templateName: null,
    }).then(async (claim) => {
      if (claim.claimed) {
        await finalizeWhatsAppLog(claim.logId, {
          status: WhatsAppMessageStatus.SKIPPED,
          error: reason,
        });
      }
    });
  } catch (logError) {
    console.error("[WhatsApp] Failed to record skipped receipt:", logError);
  }
}

