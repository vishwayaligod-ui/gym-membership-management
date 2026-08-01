export type MemberStatus = "Active" | "Expiring" | "Expired" | "Pending";

export const MEMBER_STATUS_THRESHOLD_DAYS = 7;

function normalizeDate(value: Date | string): Date {
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function getMemberStatus(
  expiryDate: Date | string | null | undefined,
  membershipStatus?: string | null
): MemberStatus {
  if (!expiryDate) {
    return "Pending";
  }

  if (membershipStatus === "EXPIRED") {
    return "Expired";
  }

  const today = normalizeDate(new Date());
  const expiry = normalizeDate(expiryDate);

  if (expiry < today) {
    return "Expired";
  }

  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry <= MEMBER_STATUS_THRESHOLD_DAYS) {
    return "Expiring";
  }

  return "Active";
}
