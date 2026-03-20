import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db, userSessions } from "@/lib/db";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await db
    .delete(userSessions)
    .where(and(eq(userSessions.id, id), eq(userSessions.userId, userId)));

  return Response.json({ success: true });
}
