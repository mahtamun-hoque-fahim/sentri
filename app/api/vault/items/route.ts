import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db, vaultItems } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db.query.vaultItems.findMany({
    where: eq(vaultItems.ownerId, userId),
    orderBy: [desc(vaultItems.updatedAt)],
  });

  return Response.json(items);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { itemType, encryptedData, iv, titleEncrypted, titleIv, faviconUrl } = body;

  const [item] = await db
    .insert(vaultItems)
    .values({
      ownerId:        userId,
      itemType,
      encryptedData,
      iv,
      titleEncrypted,
      titleIv,
      faviconUrl:     faviconUrl ?? null,
    })
    .returning();

  return Response.json(item, { status: 201 });
}
