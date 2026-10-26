import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type EnquirySessionUser = {
  id: string;
  gymId: string | null;
  branchId: string | null;
};

export type EnquiryScope = {
  gymId: string;
  branchId: string | null;
  timezone: string;
};

export async function resolveEnquiryScope(user: EnquirySessionUser) {
  if (!user.gymId) {
    return {
      scope: null,
      response: NextResponse.json({ error: "Your account is not assigned to a gym" }, { status: 403 }),
    };
  }

  const dbUser = await prisma.user.findFirst({
    where: {
      id: user.id,
      gymId: user.gymId,
      branchId: user.branchId,
      isActive: true,
    },
    select: { id: true },
  });

  if (!dbUser) {
    return {
      scope: null,
      response: NextResponse.json({ error: "Your account assignment is no longer valid" }, { status: 403 }),
    };
  }

  const gym = await prisma.gym.findUnique({
    where: { id: user.gymId },
    select: { timezone: true },
  });

  if (!gym) {
    return {
      scope: null,
      response: NextResponse.json({ error: "Your gym could not be found" }, { status: 403 }),
    };
  }

  return {
    scope: {
      gymId: user.gymId,
      branchId: user.branchId,
      timezone: gym.timezone,
    } satisfies EnquiryScope,
    response: null,
  };
}

export function dateStringInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function addDaysToDateString(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function utcDayRange(value: string) {
  return {
    start: new Date(`${value}T00:00:00.000Z`),
    end: new Date(`${addDaysToDateString(value, 1)}T00:00:00.000Z`),
  };
}

export function dateOnlyToUtc(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function isDateTodayOrLater(value: string, timezone: string): boolean {
  return value >= dateStringInTimeZone(new Date(), timezone);
}

export function dateOnlyString(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function mapEnquiryFollowUp<T extends {
  id: string;
  outcome: string;
  notes: string | null;
  contactedAt: Date;
  nextFollowUpAt: Date | null;
  recordedBy: { id: string; fullName: string } | null;
  createdAt: Date;
}>(entry: T) {
  return {
    id: entry.id,
    outcome: entry.outcome,
    notes: entry.notes,
    contactedAt: entry.contactedAt.toISOString(),
    nextFollowUpDate: dateOnlyString(entry.nextFollowUpAt),
    recordedBy: entry.recordedBy
      ? { id: entry.recordedBy.id, name: entry.recordedBy.fullName }
      : null,
    createdAt: entry.createdAt.toISOString(),
  };
}
