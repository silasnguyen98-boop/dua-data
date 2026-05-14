import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  return NextResponse.json({
    cookieNames: allCookies.map(c => c.name),
    hasSessionToken: allCookies.some(c => c.name.includes("next-auth.session-token")),
    nodeEnv: process.env.NODE_ENV,
  });
}
