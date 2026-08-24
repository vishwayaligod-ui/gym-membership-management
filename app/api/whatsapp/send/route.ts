import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { sendWhatsAppTemplateMessage, sendWhatsAppTextMessage } from "@/lib/whatsapp/service";
import { isWhatsAppTemplateName } from "@/lib/whatsapp/templates";

export async function POST(request: Request) {
  try {
    const access = await requireApiPermission("members", "update");
    if (access.response) {
      return access.response;
    }

    const body = (await request.json()) as {
      memberId?: string;
      template?: string;
      variables?: Record<string, string>;
      text?: string;
    };

    const { memberId, template, variables, text } = body;

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    // Load the member from the database to get their phone number.
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const memberName = `${member.firstName} ${member.lastName || ""}`.trim();

    // Template-based message
    if (template) {
      if (!isWhatsAppTemplateName(template)) {
        return NextResponse.json({ error: "Unknown WhatsApp template" }, { status: 400 });
      }

      const result = await sendWhatsAppTemplateMessage({
        to: member.phone,
        templateName: template,
        variables: {
          member_name: memberName,
          ...(variables ?? {}),
        },
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 502 });
      }

      return NextResponse.json({
        message: "WhatsApp message sent successfully",
        messageId: result.messageId,
      });
    }

    // Free-form text message
    if (text && text.trim().length > 0) {
      const result = await sendWhatsAppTextMessage({
        to: member.phone,
        text: text.trim(),
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 502 });
      }

      return NextResponse.json({
        message: "WhatsApp message sent successfully",
        messageId: result.messageId,
      });
    }

    return NextResponse.json(
      { error: "Provide either a template name or a text message" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return NextResponse.json(
      { error: "Failed to send WhatsApp message" },
      { status: 500 }
    );
  }
}