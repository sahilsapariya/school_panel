import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DASHBOARD_PREFIX = "/dashboard";
const LOGIN_PATH = "/login";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === LOGIN_PATH;
  const isDashboard = pathname.startsWith(DASHBOARD_PREFIX);

  const hasAuthCookie =
    request.cookies.has("token") ||
    request.cookies.has("session") ||
    request.cookies.has("auth-token");

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isDashboard && !hasAuthCookie) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLogin && hasAuthCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login"],
};
