import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete("portal_session");
  return NextResponse.redirect(new URL("/portal/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
