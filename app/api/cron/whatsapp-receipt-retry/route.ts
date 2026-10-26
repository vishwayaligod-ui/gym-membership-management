import { NextResponse } from "next/server";
import { retryFailedReceipts } from "@/lib/whatsapp/receipt-retry";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Server-side cron entry point for retrying FAILED WhatsApp renewal receipts.
 *
 * Auth: `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends this
 * automatically when the CRON_SECRET env var is set) or `x-cron-secret`.
 * Fails closed (401) when CRON_SECRET is not configured.
 */

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  const authHeader = request.headers.get("authorization") || "";
  const altHeader = request.headers.get("x-cron-secret") || "";
  return authHeader === `Bearer ${secret}` || altHeader === secret;
}

async function handle(request: Request): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await retryFailedReceipts();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error("[Cron] WhatsApp receipt retry run failed:", error);
    return NextResponse.json(
      { error: "Receipt retry run failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
