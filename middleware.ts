import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hasSupabaseAuthCookie(req: NextRequest) {
  const cookies = req.cookies.getAll();

  return cookies.some((cookie) => {
    const name = cookie.name;
    return (
      name.includes("sb-") &&
      (name.includes("auth-token") ||
        name.includes("access-token") ||
        name.includes("refresh-token"))
    );
  });
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname === "/select-company" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/");

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!hasSupabaseAuthCookie(req)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/select-company"],
};
