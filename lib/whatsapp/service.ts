/**
 * Core WhatsApp Cloud API service.
 *
 * Sends template-based and free-form text messages to members.
 * All credentials come from server-side environment variables.
 * Phone numbers are normalized/validated before sending.
 */

import { getWhatsAppConfig, type WhatsAppConfig } from "./config";
import { normalizeIndianPhoneNumber } from "./phone";
import { getWhatsAppTemplate, type WhatsAppTemplateName } from "./templates";

export type SendWhatsAppResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

type SendTemplateMessageParams = {
  to: string; // raw member phone number (any common Indian format)
  templateName: WhatsAppTemplateName;
  variables: Record<string, string>;
  /** Optional explicit config (per-gym). Defaults to env config. */
  config?: WhatsAppConfig;
};

type SendTextMessageParams = {
  to: string;
  text: string;
  /** Optional explicit config (per-gym). Defaults to env config. */
  config?: WhatsAppConfig;
};

/**
 * Send a template-based WhatsApp message.
 */
export async function sendWhatsAppTemplateMessage({
  to,
  templateName,
  variables,
  config,
}: SendTemplateMessageParams): Promise<SendWhatsAppResult> {
  const resolved = config ?? getWhatsAppConfig();
  if (!resolved) {
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
      // Send the Meta-approved template name when one is mapped; otherwise
      // the internal name as before.
      name: template.metaName ?? template.name,
      language: {
        code: template.languageCode,
      },
      components,
    },
  };

  return sendToWhatsApp(resolved, payload);
}

/**
 * Send a free-form text WhatsApp message (e.g. AI diet plan delivery).
 */
export async function sendWhatsAppTextMessage({
  to,
  text,
  config,
}: SendTextMessageParams): Promise<SendWhatsAppResult> {
  const resolved = config ?? getWhatsAppConfig();
  if (!resolved) {
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

  return sendToWhatsApp(resolved, payload);
}

/**
 * Upload a media file (e.g. a PDF receipt) to WhatsApp and return its media ID.
 * The returned ID can be attached to document messages or template headers.
 */
export async function uploadWhatsAppMedia({
  config,
  file,
  mimeType,
  filename,
}: {
  config: WhatsAppConfig;
  file: Uint8Array;
  mimeType: string;
  filename: string;
}): Promise<{ success: true; mediaId: string } | { success: false; error: string }> {
  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/media`;

  try {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append(
      "file",
      new Blob([new Uint8Array(file)], { type: mimeType }),
      filename
    );
    form.append("type", mimeType);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("WhatsApp media upload error:", response.status, errorBody);
      return {
        success: false,
        error: `WhatsApp media upload returned status ${response.status}.`,
      };
    }

    const data = (await response.json()) as { id?: string };
    if (!data.id) {
      return { success: false, error: "WhatsApp media upload did not return an ID." };
    }

    return { success: true, mediaId: data.id };
  } catch (error) {
    console.error("Failed to upload WhatsApp media:", error);
    return { success: false, error: "Failed to reach WhatsApp API for media upload." };
  }
}

/**
 * Send a free-form document (media) message — e.g. a PDF receipt with a
 * short caption. Works when the recipient has an open 24-hour customer
 * service window; outside that window Meta requires a template message
 * (see sendWhatsAppTemplateDocumentMessage).
 */
export async function sendWhatsAppDocumentMessage({
  config,
  to,
  mediaId,
  filename,
  caption,
}: {
  config: WhatsAppConfig;
  to: string;
  mediaId: string;
  filename: string;
  caption?: string;
}): Promise<SendWhatsAppResult> {
  const normalized = normalizeIndianPhoneNumber(to);
  if (!normalized) {
    return { success: false, error: "Invalid Indian phone number. Cannot send WhatsApp message." };
  }

  const payload = {
    messaging_product: "whatsapp",
    to: normalized,
    type: "document",
    document: {
      id: mediaId,
      filename,
      ...(caption ? { caption } : {}),
    },
  };

  return sendToWhatsApp(config, payload);
}

/**
 * Send an approved template message whose header is a DOCUMENT (the actual
 * PDF). This is the correct mechanism to deliver a PDF to a member outside
 * the 24-hour window. The Meta template must define a DOCUMENT header
 * component followed by the body variables declared in the registry.
 */
export async function sendWhatsAppTemplateDocumentMessage({
  config,
  to,
  templateName,
  variables,
  documentMediaId,
  documentFilename,
}: {
  config: WhatsAppConfig;
  to: string;
  templateName: WhatsAppTemplateName;
  variables: Record<string, string>;
  documentMediaId: string;
  documentFilename: string;
}): Promise<SendWhatsAppResult> {
  const template = getWhatsAppTemplate(templateName);
  if (!template) {
    return { success: false, error: `Unknown WhatsApp template: ${templateName}` };
  }

  const normalized = normalizeIndianPhoneNumber(to);
  if (!normalized) {
    return { success: false, error: "Invalid Indian phone number. Cannot send WhatsApp message." };
  }

  const payload = {
    messaging_product: "whatsapp",
    to: normalized,
    type: "template",
    template: {
      // Send the Meta-approved template name when one is mapped; otherwise
      // the internal name as before.
      name: template.metaName ?? template.name,
      language: {
        code: template.languageCode,
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "document",
              document: {
                id: documentMediaId,
                filename: documentFilename,
              },
            },
          ],
        },
        {
          type: "body",
          parameters: template.variables.map((key) => ({
            type: "text",
            text: variables[key] ?? "",
          })),
        },
      ],
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