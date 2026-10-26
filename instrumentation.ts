/**
 * Next.js instrumentation hook (runs once per server instance).
 *
 * Starts the internal WhatsApp renewal-reminder scheduler on long-running
 * Node.js servers. Skipped on serverless/Vercel (vercel.json cron drives
 * /api/cron/whatsapp-reminders there) and when WHATSAPP_SCHEDULER_DISABLED=true.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  if (process.env.VERCEL) {
    return; // Vercel Cron owns the schedule in that environment.
  }
  if (process.env.WHATSAPP_SCHEDULER_DISABLED === "true") {
    return;
  }

  const globalRef = globalThis as {
    __gymWhatsappSchedulerBooted?: boolean;
  };
  if (globalRef.__gymWhatsappSchedulerBooted) {
    return;
  }
  globalRef.__gymWhatsappSchedulerBooted = true;

  const { startWhatsappReminderScheduler } = await import(
    "@/lib/whatsapp/scheduler"
  );
  startWhatsappReminderScheduler();
}
