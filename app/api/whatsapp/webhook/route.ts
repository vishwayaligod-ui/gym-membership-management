import { NextResponse } from "next/server";
import { getWhatsAppConfig } from "@/lib/whatsapp/config";

export async function GET(request: Request) {
  const config = getWhatsAppConfig();
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const verifyToken = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && verifyToken && config && verifyToken === config.webhookVerifyToken) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new NextResponse("Verification failed", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body?.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes ?? []) {
          if (change.field === "messages") {
            const value = change.value ?? {};
            const messages = value.messages ?? [];
            const statuses = value.statuses ?? [];
            if (messages.length > 0) {
              console.log(`[WhatsApp] Received ${messages.length} message(s)`);
            }
            if (statuses.length > 0) {
              console.log(`[WhatsApp] Received ${statuses.length} status update(s)`);
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[WhatsApp] Failed to process webhook:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}