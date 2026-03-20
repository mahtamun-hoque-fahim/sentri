import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { db, itemHistory } from "@/lib/db";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ itemId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { itemId } = await params;
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const history = await db.query.itemHistory.findMany({
    where: and(eq(itemHistory.itemId, itemId), eq(itemHistory.ownerId, userId)),
    orderBy: [desc(itemHistory.changedAt)],
    limit: 10,
  });

  return Response.json(history);
}
