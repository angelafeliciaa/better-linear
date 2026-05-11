import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { LinearClient } from "@linear/sdk";
import { sessionOptions, type SessionData } from "@/lib/auth/session";
import { exchangeCodeForToken, validateOAuthState } from "@/lib/auth/oauth";

const STATE_COOKIE = "better-linear-oauth-state";

export async function GET(req: NextRequest) {
  const clientId = process.env.LINEAR_CLIENT_ID;
  const clientSecret = process.env.LINEAR_CLIENT_SECRET;
  const redirectUri = process.env.LINEAR_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/settings?error=oauth_unconfigured", req.url), { status: 303 });
  }

  const code = req.nextUrl.searchParams.get("code");
  const queryState = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/settings?error=oauth_denied", req.url), { status: 303 });
  }
  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=oauth_no_code", req.url), { status: 303 });
  }

  const cookieStore = await cookies();
  const cookieState = cookieStore.get(STATE_COOKIE)?.value ?? null;

  if (!validateOAuthState(cookieState, queryState)) {
    return NextResponse.redirect(new URL("/settings?error=oauth_state", req.url), { status: 303 });
  }

  let accessToken: string;
  try {
    const token = await exchangeCodeForToken({ code, clientId, clientSecret, redirectUri });
    accessToken = token.access_token;
  } catch {
    return NextResponse.redirect(new URL("/settings?error=oauth_exchange", req.url), { status: 303 });
  }

  let viewerId: string;
  try {
    const linear = new LinearClient({ accessToken });
    const viewer = await linear.viewer;
    viewerId = viewer.id;
  } catch {
    return NextResponse.redirect(new URL("/settings?error=oauth_viewer", req.url), { status: 303 });
  }

  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.accessToken = accessToken;
  session.linearUserId = viewerId;
  await session.save();

  const res = NextResponse.redirect(new URL("/graph", req.url), { status: 303 });
  res.cookies.delete(STATE_COOKIE);
  return res;
}
