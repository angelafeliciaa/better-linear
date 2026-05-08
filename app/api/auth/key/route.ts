import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { LinearClient } from "@linear/sdk";
import { sessionOptions, type SessionData } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const apiKey = String(form.get("apiKey") ?? "").trim();

  if (!apiKey) {
    return NextResponse.redirect(new URL("/settings?error=missing", req.url), { status: 303 });
  }

  let viewerId: string;
  try {
    const linear = new LinearClient({ apiKey });
    const viewer = await linear.viewer;
    viewerId = viewer.id;
  } catch {
    return NextResponse.redirect(new URL("/settings?error=invalid", req.url), { status: 303 });
  }

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.accessToken = apiKey;
  session.linearUserId = viewerId;
  await session.save();

  return NextResponse.redirect(new URL("/graph", req.url), { status: 303 });
}
