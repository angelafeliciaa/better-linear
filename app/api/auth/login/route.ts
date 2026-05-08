import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { buildLinearAuthUrl } from "@/lib/auth/oauth";

export async function GET() {
  const clientId = process.env.LINEAR_CLIENT_ID;
  const redirectUri = process.env.LINEAR_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return new NextResponse("Linear OAuth env vars missing.", { status: 500 });
  }
  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(buildLinearAuthUrl({ clientId, redirectUri, state }));
}
