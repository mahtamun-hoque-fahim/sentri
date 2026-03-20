import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db, vaultInvites } from "@/lib/db";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { status } = await req.json();
  const [updated] = await db.update(vaultInvites).set({ status }).where(eq(vaultInvites.id, id)).returning();
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await db.delete(vaultInvites).where(and(eq(vaultInvites.id, id), eq(vaultInvites.createdBy, userId)));
  return Response.json({ success: true });
}
