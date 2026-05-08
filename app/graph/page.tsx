import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/get-session";
import { GraphView } from "@/components/graph/GraphView";

export default async function GraphPage() {
  const session = await getSession();
  if (!session) redirect("/settings");
  return <GraphView />;
}
