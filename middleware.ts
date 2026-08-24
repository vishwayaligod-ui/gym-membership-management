import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { encode, getToken } from "next-auth/jwt";
import { canAccessPath } from "@/lib/permissions";
import type { UserRole as Role } from "@prisma/client";

type MiddlewareToken = {
  role?: Role | null;
};

const protectedPrefixes = [
  "/dashboard",
  "/attendance",
  "/members",
  "/payment-history",
  "/renewals",
  "/reports",
  "/profile",
  "/notifications",
  "/memberships",
  "/trainers",
  "/membership-plans",
  "/settings",
];

// Development-only demo identity.
//
// The existing DEMO_MODE bypass lets unauthenticated requests reach protected
// routes, but it never creates an authenticated token/session, so the client-side
// Sidebar/BottomNavigation (which rely on useSession().user.role) see no role and
// hide every GYM_OWNER option. In development AND demo mode only, we fabricate a
// real, short-lived Auth.js JWT for a GYM_OWNER demo identity and store it in the
// standard Auth.js session cookie. Because NODE_ENV is inlined at build time, this
// is dead code in production/Vercel and never alters production authentication.
const DEMO_SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours
const DEMO_SESSION_COOKIE_NAME = "authjs.session-token";
const DEMO_SESSION_SECURE_COOKIE_NAME = "__Secure-authjs.session-token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isSignupLoginRedirect =
    pathname === "/login" && request.nextUrl.searchParams.get("signup") === "success";

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  if (pathname === "/forbidden") {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "development-secret";
  const isDemoMode = process.env.DEMO_MODE === "true";
  const isDevelopment = process.env.NODE_ENV === "development";

  let token = (await getToken({ req: request, secret })) as MiddlewareToken | null;
  const seededDemoSession = isDemoMode && isDevelopment && !token;

  if (seededDemoSession) {
    token = { role: "GYM_OWNER" };
  }

  const isAuthenticated = Boolean(token);
  const isLoginRoute = pathname === "/login";
  const isRootRoute = pathname === "/";
  const isProtectedRoute = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  let response: NextResponse;

  if (isLoginRoute) {
    if (isSignupLoginRedirect) {
      response = NextResponse.next();
    } else if (isAuthenticated || isDemoMode) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      response = NextResponse.redirect(redirectUrl);
    } else {
      response = NextResponse.next();
    }
  } else if (isRootRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = isAuthenticated ? "/dashboard" : "/login";
    response = NextResponse.redirect(redirectUrl);
  } else if (isProtectedRoute && !isAuthenticated && !isDemoMode) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    response = NextResponse.redirect(redirectUrl);
  } else if (isProtectedRoute && isAuthenticated && !canAccessPath(token?.role, pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/forbidden";
    response = NextResponse.rewrite(redirectUrl, { status: 403 });
  } else {
    response = NextResponse.next();
  }

  // Attach the dev-only demo session cookie to the response we are returning.
  if (seededDemoSession) {
    const isSecure = request.nextUrl.protocol === "https:";
    const cookieName = isSecure
      ? DEMO_SESSION_SECURE_COOKIE_NAME
      : DEMO_SESSION_COOKIE_NAME;

    const demoJwt = await encode({
      token: {
        sub: "demo-gym-owner",
        id: "demo-gym-owner",
        name: "Demo Gym Owner",
        email: "demo@gymowner.local",
        role: "GYM_OWNER",
        gymId: null,
        branchId: null,
      },
      secret,
      salt: cookieName,
      maxAge: DEMO_SESSION_MAX_AGE,
    });

    response.cookies.set(cookieName, demoJwt, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: DEMO_SESSION_MAX_AGE,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
