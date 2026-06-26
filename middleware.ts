import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/security/rate-limit";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiRequest = pathname.startsWith("/api/");
  const isDashboardRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/platform");
  const isMemberRoute = pathname.startsWith("/member") && !pathname.startsWith("/member/login");
  const response = NextResponse.next({ request });
  if (isApiRequest) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const result = rateLimit(`api:${ip}`);
    if (!result.allowed) return NextResponse.json({ error: "Trop de requêtes. Réessayez dans quelques instants." }, { status: 429, headers: { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) } });
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  }
  
  if (isDashboardRoute && !request.cookies.get("insforge_access_token")?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  if (isMemberRoute && !request.cookies.get("member_session")?.value) {
    return NextResponse.redirect(new URL("/member/login", request.url));
  }
  
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
