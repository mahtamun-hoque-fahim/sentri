import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db, vaultItems } from "@/lib/db";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const item = await db.query.vaultItems.findFirst({
    where: and(eq(vaultItems.id, id), eq(vaultItems.ownerId, userId)),
  });

  if (!item) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(item);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { encryptedData, iv, titleEncrypted, titleIv } = body;

  const [updated] = await db
    .update(vaultItems)
    .set({ encryptedData, iv, titleEncrypted, titleIv, updatedAt: new Date() })
    .where(and(eq(vaultItems.id, id), eq(vaultItems.ownerId, userId)))
    .returning();

  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await db
    .delete(vaultItems)
    .where(and(eq(vaultItems.id, id), eq(vaultItems.ownerId, userId)));

  return Response.json({ success: true });
}
