import { NextResponse, type NextRequest } from "next/server";

function normalizeHostname(value: string | null) {
  return value?.split(",")[0]?.trim().toLowerCase().split(":")[0] ?? "";
}

function isAdminPath(pathname: string) {
  return pathname === "/libsystem-admin-secure-access-7k9m2x4q" || pathname === "/admin" || pathname.startsWith("/admin/");
}

export function proxy(request: NextRequest) {
  const adminHostname = normalizeHostname(process.env.ADMIN_HOSTNAME ?? null);

  if (!adminHostname) {
    return NextResponse.next();
  }

  const requestHostname = normalizeHostname(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  const allowLocalDevelopment =
    process.env.NODE_ENV !== "production" && (requestHostname === "localhost" || requestHostname === "127.0.0.1");

  if (isAdminPath(request.nextUrl.pathname) && requestHostname !== adminHostname && !allowLocalDevelopment) {
    const unavailableUrl = request.nextUrl.clone();
    unavailableUrl.pathname = "/_admin-unavailable";
    return NextResponse.rewrite(unavailableUrl);
  }

  if (requestHostname === adminHostname && request.nextUrl.pathname === "/") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/libsystem-admin-secure-access-7k9m2x4q";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/libsystem-admin-secure-access-7k9m2x4q", "/admin/:path*"],
};
