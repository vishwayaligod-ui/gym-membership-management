/**
 * Core WhatsApp Cloud API service.
 *
 * Sends template-based and free-form text messages to members.
 * All credentials come from server-side environment variables.
 * Phone numbers are normalized/validated before sending.
 */

import { getWhatsAppConfig } from "./config";
import { normalizeIndianPhoneNumber } from "./phone";
import { getWhatsAppTemplate, type WhatsAppTemplateName } from "./templates";

export type SendWhatsAppResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

type SendTemplateMessageParams = {
  to: string; // raw member phone number (any common Indian format)
  templateName: WhatsAppTemplateName;
  variables: Record<string, string>;
};

type SendTextMessageParams = {
  to: string;
  text: string;
};

/**
 * Send a template-based WhatsApp message.
 */
export async function sendWhatsAppTemplateMessage({
  to,
  templateName,
  variables,
}: SendTemplateMessageParams): Promise<SendWhatsAppResult> {
  const config = getWhatsAppConfig();
  if (!config) {
    return { success: false, error: "WhatsApp is not configured. Add credentials in environment variables." };
  }

  const normalized = normalizeIndianPhoneNumber(to);
  if (!normalized) {
    return { success: false, error: "Invalid Indian phone number. Cannot send WhatsApp message." };
  }

  const template = getWhatsAppTemplate(templateName);
  if (!template) {
    return { success: false, error: `Unknown WhatsApp template: ${templateName}` };
  }

  // Build the components array in the order the template declares variables.
  const components = [
    {
      type: "body",
      parameters: template.variables.map((key) => ({
        type: "text",
        text: variables[key] ?? "",
      })),
    },
  ];

  const payload = {
    messaging_product: "whatsapp",
    to: normalized,
    type: "template",
    template: {
      name: template.name,
      language: {
        code: template.languageCode,
      },
      components,
    },
  };

  return sendToWhatsApp(config, payload);
}

/**
 * Send a free-form text WhatsApp message (e.g. AI diet plan delivery).
 */
export async function sendWhatsAppTextMessage({
  to,
  text,
}: SendTextMessageParams): Promise<SendWhatsAppResult> {
  const config = getWhatsAppConfig();
  if (!config) {
    return { success: false, error: "WhatsApp is not configured. Add credentials in environment variables." };
  }

  const normalized = normalizeIndianPhoneNumber(to);
  if (!normalized) {
    return { success: false, error: "Invalid Indian phone number. Cannot send WhatsApp message." };
  }

  const payload = {
    messaging_product: "whatsapp",
    to: normalized,
    type: "text",
    text: {
      body: text,
    },
  };

  return sendToWhatsApp(config, payload);
}

async function sendToWhatsApp(
  config: { accessToken: string; phoneNumberId: string; apiVersion: string },
  payload: unknown
): Promise<SendWhatsAppResult> {
  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("WhatsApp API error:", response.status, errorBody);
      return {
        success: false,
        error: `WhatsApp API returned status ${response.status}. Check your configuration.`,
      };
    }

    const data = (await response.json()) as { messages?: Array<{ id: string }> };
    const messageId = data.messages?.[0]?.id;

    if (!messageId) {
      return { success: false, error: "WhatsApp API did not return a message ID." };
    }

    return { success: true, messageId };
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return { success: false, error: "Failed to reach WhatsApp API. Please try again." };
  }
}