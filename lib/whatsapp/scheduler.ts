/**
 * Internal background scheduler for long-running Node.js deployments.
 *
 * Runs the renewal-reminder job shortly after server boot and then every
 * 6 hours. The job itself is idempotent (unique dedupe keys in
 * WhatsAppMessageLog), so frequent runs are safe and can never spam members.
 *
 * On Vercel (or any serverless host) this internal timer is NOT used —
 * `vercel.json` schedules the `/api/cron/whatsapp-reminders` endpoint
 * instead. Set WHATSAPP_SCHEDULER_DISABLED=true to opt out entirely.
 */

import { runRenewalReminders } from "./reminders";

const INITIAL_DELAY_MS = 30 * 1000; // 30s after boot
const RUN_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

export function startWhatsappReminderScheduler(): void {
  const globalRef = globalThis as {
    __gymWhatsappReminderTimer?: NodeJS.Timeout;
  };

  // Guard against duplicate timers (dev hot reload, multiple imports).
  if (globalRef.__gymWhatsappReminderTimer) {
    return;
  }

  const safeRun = async () => {
    try {
      const summary = await runRenewalReminders();
      console.log("[WhatsAppScheduler] reminder run:", JSON.stringify(summary));
    } catch (error) {
      console.error("[WhatsAppScheduler] reminder run failed:", error);
    }
  };

  const initialRun = setTimeout(() => {
    void safeRun();
  }, INITIAL_DELAY_MS);
  initialRun.unref?.();

  const timer = setInterval(() => {
    void safeRun();
  }, RUN_INTERVAL_MS);
  timer.unref?.();

  globalRef.__gymWhatsappReminderTimer = timer;
  console.log("[WhatsAppScheduler] started (runs every 6 hours)");
}
