import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("portal_session");
  cookieStore.delete("member_session");
  
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL("/member/login", origin));
}
