import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { LinearClient } from "@linear/sdk";
import { exchangeCodeForToken, validateOAuthState } from "@/lib/auth/oauth";
import { sessionOptions, type SessionData } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const queryState = url.searchParams.get("state");
  const cookieStore = await cookies();
  const cookieState = cookieStore.get("oauth_state")?.value ?? null;

  if (!validateOAuthState(cookieState, queryState)) {
    return new NextResponse("Invalid OAuth state.", { status: 400 });
  }
  if (!code) return new NextResponse("Missing OAuth code.", { status: 400 });

  const clientId = process.env.LINEAR_CLIENT_ID!;
  const clientSecret = process.env.LINEAR_CLIENT_SECRET!;
  const redirectUri = process.env.LINEAR_REDIRECT_URI!;

  const token = await exchangeCodeForToken({ code, clientId, clientSecret, redirectUri });
  const linear = new LinearClient({ accessToken: token.access_token });
  const viewer = await linear.viewer;

  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.accessToken = token.access_token;
  session.linearUserId = viewer.id;
  await session.save();

  cookieStore.delete("oauth_state");
  return NextResponse.redirect(new URL("/graph", req.url));
}
