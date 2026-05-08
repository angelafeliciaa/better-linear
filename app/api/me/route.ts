import { NextResponse } from "next/server";
import { LinearClient } from "@linear/sdk";
import { requireSession } from "@/lib/auth/get-session";

export async function GET() {
  let session;
  try { session = await requireSession(); } catch { return new NextResponse("Unauthorized", { status: 401 }); }
  const linear = new LinearClient({ accessToken: session.accessToken });
  const viewer = await linear.viewer;
  return NextResponse.json({
    id: viewer.id,
    name: viewer.name,
    displayName: viewer.displayName,
    avatarUrl: viewer.avatarUrl ?? null,
  });
}
