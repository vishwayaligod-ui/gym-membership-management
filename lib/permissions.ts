import type { UserRole as Role } from "@prisma/client";

export type AccessRole = "OWNER" | "RECEPTIONIST";

export type PermissionResource =
  | "dashboard"
  | "members"
  | "attendance"
  | "renewals"
  | "payments"
  | "reports"
  | "profile"
  | "membershipPlans"
  | "settings"
  | "trainers"
  | "notifications"
  | "memberships";

export type PermissionAction = "read" | "create" | "update" | "delete" | "manage";

const receptionistResources = new Set<PermissionResource>([
  "dashboard",
  "members",
  "attendance",
  "renewals",
  "payments",
  "reports",
  "profile",
  "notifications",
  "memberships",
]);

const routePermissions: Array<{ prefix: string; resource: PermissionResource }> = [
  { prefix: "/dashboard", resource: "dashboard" },
  { prefix: "/members", resource: "members" },
  { prefix: "/attendance", resource: "attendance" },
  { prefix: "/renewals", resource: "renewals" },
  { prefix: "/payment-history", resource: "payments" },
  { prefix: "/reports", resource: "reports" },
  { prefix: "/profile", resource: "profile" },
  { prefix: "/membership-plans", resource: "membershipPlans" },
  { prefix: "/settings", resource: "settings" },
  { prefix: "/trainers", resource: "trainers" },
  { prefix: "/notifications", resource: "notifications" },
  { prefix: "/memberships", resource: "memberships" },
];

export function getAccessRole(role?: Role | null): AccessRole {
  return role === "RECEPTIONIST" ? "RECEPTIONIST" : "OWNER";
}

export function hasPermission(
  role: Role | AccessRole | null | undefined,
  resource: PermissionResource,
  _action: PermissionAction = "read"
): boolean {
  if (!role) {
    return false;
  }

  if (getAccessRole(role as Role) === "OWNER") {
    return true;
  }

  return receptionistResources.has(resource);
}

export function getResourceForPath(pathname: string): PermissionResource | null {
  const normalizedPath = pathname.split("?")[0] || pathname;

  for (const { prefix, resource } of routePermissions) {
    if (normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)) {
      return resource;
    }
  }

  return null;
}

export function canAccessPath(role: Role | AccessRole | null | undefined, pathname: string): boolean {
  const resource = getResourceForPath(pathname);

  if (!resource) {
    return true;
  }

  return hasPermission(role, resource, "read");
}
