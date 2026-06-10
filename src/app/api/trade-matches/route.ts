import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTradeMatches } from "@/lib/queries/trades";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const theirId = req.nextUrl.searchParams.get("theirId");
  if (!theirId) return NextResponse.json({ error: "theirId required" }, { status: 400 });

  const matches = await getTradeMatches(session.user.id, theirId);
  return NextResponse.json(matches);
}
