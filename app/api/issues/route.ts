import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/get-session";
import { fetchAssignedGraph } from "@/lib/linear/client";

export async function GET() {
  let session;
  try { session = await requireSession(); } catch { return new NextResponse("Unauthorized", { status: 401 }); }
  try {
    const graph = await fetchAssignedGraph(session.accessToken);
    return NextResponse.json(graph, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    const status = err instanceof Response ? err.status : 500;
    const message = err instanceof Error ? err.message : "Failed to fetch issues from Linear.";
    return NextResponse.json({ error: message }, { status });
  }
}
