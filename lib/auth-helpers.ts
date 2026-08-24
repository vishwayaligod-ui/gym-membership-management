import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { hasPermission, type PermissionAction, type PermissionResource } from "@/lib/permissions";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role as UserRole)) {
    redirect("/forbidden");
  }

  return session;
}

export async function requirePermission(resource: PermissionResource, action: PermissionAction = "read") {
  const session = await requireAuth();

  if (!hasPermission(session.user.role, resource, action)) {
    redirect("/forbidden");
  }

  return session;
}

export async function requireApiPermission(
  resource: PermissionResource,
  action: PermissionAction = "read"
) {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!hasPermission(session.user.role, resource, action)) {
    return {
      session,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, response: null };
}
