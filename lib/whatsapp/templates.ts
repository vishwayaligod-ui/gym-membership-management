/**
 * WhatsApp message template registry.
 *
 * Templates are referenced by NAME + LANGUAGE CODE + VARIABLES.
 * We do NOT hardcode Meta template IDs — the Cloud API resolves
 * templates by name/language when sending.
 *
 * Each template documents the variables it accepts so callers
 * provide the correct values.
 */

export type WhatsAppTemplateName =
  | "WELCOME_MEMBER"
  | "PAYMENT_RECEIPT"
  | "RENEWAL_REMINDER"
  | "RENEWAL_REMINDER_3_DAYS"
  | "RENEWAL_RECEIPT"
  | "MEMBERSHIP_EXPIRY"
  | "PAYMENT_DUE"
  | "AI_DIET_PLAN";

export type WhatsAppTemplate = {
  name: WhatsAppTemplateName;
  /**
   * Exact template name approved on Meta, when it differs from the internal
   * `name` key. The Cloud API resolves templates by name + language, so the
   * value sent to Meta must match the approved template exactly.
   * When absent, `name` is sent unchanged.
   */
  metaName?: string;
  languageCode: string;
  /** Ordered list of variable placeholders used by the template body. */
  variables: string[];
  /** Human-readable description of when this template is used. */
  description: string;
};

export const WHATSAPP_TEMPLATES: Record<WhatsAppTemplateName, WhatsAppTemplate> = {
  WELCOME_MEMBER: {
    name: "WELCOME_MEMBER",
    languageCode: "en",
    variables: ["member_name", "gym_name", "plan_name", "expiry_date"],
    description: "Sent after a new member registers.",
  },
  PAYMENT_RECEIPT: {
    name: "PAYMENT_RECEIPT",
    languageCode: "en",
    variables: ["member_name", "amount", "payment_mode", "receipt_number", "gym_name"],
    description: "Payment receipt confirmation message.",
  },
  RENEWAL_REMINDER: {
    name: "RENEWAL_REMINDER",
    // 7-day reminder — name of the ACTIVE template approved on Meta.
    metaName: "membership_renewal_reminder",
    languageCode: "en",
    // Approved Meta body has exactly 3 params, in this order:
    // {{1}} member_name, {{2}} plan_name, {{3}} expiry_date (no gym_name).
    variables: ["member_name", "plan_name", "expiry_date"],
    description: "Reminder sent 7 days before membership expiry.",
  },
  RENEWAL_REMINDER_3_DAYS: {
    name: "RENEWAL_REMINDER_3_DAYS",
    // Reuse the same ACTIVE Meta template as the 7-day reminder.
    metaName: "membership_renewal_reminder",
    languageCode: "en",
    // Approved Meta body has exactly 3 params, in this order:
    // {{1}} member_name, {{2}} plan_name, {{3}} expiry_date (no gym_name).
    variables: ["member_name", "plan_name", "expiry_date"],
    description:
      "Second reminder sent 3 days before membership expiry (expires in 3 days).",
  },
  RENEWAL_RECEIPT: {
    name: "RENEWAL_RECEIPT",
    // Name of the ACTIVE template approved on Meta for the renewal receipt PDF.
    metaName: "renewal_receipt",
    languageCode: "en",
    variables: ["member_name", "amount", "receipt_number", "gym_name"],
    description:
      "Sent after a successful renewal/payment. Must be created in Meta with a DOCUMENT header component (the renewal receipt PDF) — the PDF is attached via the template header.",
  },
  MEMBERSHIP_EXPIRY: {
    name: "MEMBERSHIP_EXPIRY",
    languageCode: "en",
    variables: ["member_name", "expiry_date", "gym_name"],
    description: "Notification that membership has expired.",
  },
  PAYMENT_DUE: {
    name: "PAYMENT_DUE",
    languageCode: "en",
    variables: ["member_name", "amount_due", "due_date", "gym_name"],
    description: "Reminder for outstanding payment dues.",
  },
  AI_DIET_PLAN: {
    name: "AI_DIET_PLAN",
    languageCode: "en",
    variables: ["member_name", "gym_name"],
    description: "Delivery of an AI-generated diet plan.",
  },
};

export function getWhatsAppTemplate(name: WhatsAppTemplateName): WhatsAppTemplate | null {
  return WHATSAPP_TEMPLATES[name] ?? null;
}

export function isWhatsAppTemplateName(value: string): value is WhatsAppTemplateName {
  return value in WHATSAPP_TEMPLATES;
}