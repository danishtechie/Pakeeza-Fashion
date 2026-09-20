import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Server-side gate for the entire /admin surface (pages AND API routes).
 * This is the authoritative check — individual admin API routes also
 * re-check the session themselves (defense in depth), since middleware
 * alone is not sufficient authorization in some edge/runtime configs.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdminArea = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin");

  if ((isAdminArea || isAdminApi) && !req.auth?.user) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
