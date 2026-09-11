import { NextResponse } from "next/server";
import { getExplorerSnapshot } from "@/lib/explorer";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getExplorerSnapshot();

  return NextResponse.json({
    data: snapshot.actions,
    fetchedAt: snapshot.fetchedAt,
    sourceError: snapshot.sourceError,
  });
}
