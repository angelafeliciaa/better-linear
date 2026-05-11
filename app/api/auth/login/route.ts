import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { buildLinearAuthUrl } from "@/lib/auth/oauth";

const STATE_COOKIE = "better-linear-oauth-state";

export async function GET(req: NextRequest) {
  const clientId = process.env.LINEAR_CLIENT_ID;
  const redirectUri = process.env.LINEAR_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(new URL("/settings?error=oauth_unconfigured", req.url), { status: 303 });
  }

  const state = crypto.randomBytes(16).toString("hex");
  const url = buildLinearAuthUrl({ clientId, redirectUri, state });

  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
