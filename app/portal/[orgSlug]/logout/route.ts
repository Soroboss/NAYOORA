import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request, { params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const cookieStore = await cookies();
  cookieStore.delete("member_session");
  cookieStore.delete("portal_session");
  
  return NextResponse.redirect(new URL(`/portal/${orgSlug}/login`, request.url));
}
