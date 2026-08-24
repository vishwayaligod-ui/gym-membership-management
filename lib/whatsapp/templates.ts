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
  | "MEMBERSHIP_EXPIRY"
  | "PAYMENT_DUE"
  | "AI_DIET_PLAN";

export type WhatsAppTemplate = {
  name: WhatsAppTemplateName;
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
    languageCode: "en",
    variables: ["member_name", "plan_name", "expiry_date", "gym_name"],
    description: "Reminder before membership renewal due date.",
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