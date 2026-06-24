import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/security/rate-limit";

type CookieToSet = { name: string; value: string; options?: any };

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const isApiRequest = pathname.startsWith("/api/");
  const isPrivateRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/member") || pathname.startsWith("/platform");

  if (isApiRequest) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const result = rateLimit(`api:${ip}`);
    if (!result.allowed) {
      return NextResponse.json({ error: "Trop de requêtes. Réessayez dans quelques instants." }, { status: 429, headers: { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) } });
    }
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // The public marketing site must remain available while the backend is being
  // provisioned or migrated to InsForge. Protected routes still enforce auth in
  // their server components once a backend client is configured.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPrivateRoute) return NextResponse.redirect(new URL("/?backend=configuration", request.url));
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: (items: CookieToSet[]) => { items.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (isPrivateRoute && !user) return NextResponse.redirect(new URL("/login", request.url));
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
