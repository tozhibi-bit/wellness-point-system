import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // ログイン関連APIのレート制限(IP単位、15分で30回まで)
  if (pathname.startsWith("/api/auth/callback/credentials")) {
    const ip = getClientIp(req.headers);
    const result = rateLimit(`login:${ip}`, 30, 15 * 60 * 1000);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "ログイン試行が多すぎます。しばらく待ってから再度お試しください。" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }
  }

  // CSV一括インポートのレート制限(IP単位、1時間で20回まで)
  if (pathname.startsWith("/api/superadmin/import")) {
    const ip = getClientIp(req.headers);
    const result = rateLimit(`import:${ip}`, 20, 60 * 60 * 1000);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "インポート試行が多すぎます。しばらく待ってから再度お試しください。" },
        { status: 429 }
      );
    }
  }

  const publicPaths = ["/login", "/api/auth"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublic) {
    if (session?.user && pathname === "/login") {
      const dashboard = roleToPath(session.user.role);
      return NextResponse.redirect(new URL(dashboard, req.url));
    }
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role;
  const allowedPrefix = roleToPath(role);

  if (pathname === "/") {
    return NextResponse.redirect(new URL(allowedPrefix, req.url));
  }

  if (
    (pathname.startsWith("/employee") && role !== "employee") ||
    (pathname.startsWith("/merchant") && role !== "merchant") ||
    (pathname.startsWith("/admin") && role !== "admin") ||
    (pathname.startsWith("/superadmin") && role !== "superadmin")
  ) {
    return NextResponse.redirect(new URL(allowedPrefix, req.url));
  }

  return NextResponse.next();
});

function roleToPath(role: string): string {
  switch (role) {
    case "employee":
      return "/employee";
    case "merchant":
      return "/merchant";
    case "admin":
      return "/admin";
    case "superadmin":
      return "/superadmin";
    default:
      return "/login";
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf)$).*)",
  ],
};
