import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/create")) {
    return NextResponse.next();
  }

  const hasPrivySession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.toLowerCase().includes("privy"));

  if (!hasPrivySession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/create/:path*"],
};
