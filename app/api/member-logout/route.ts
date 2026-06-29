import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("member_session");
  cookieStore.delete("portal_session");
  return NextResponse.json({ success: true });
}
