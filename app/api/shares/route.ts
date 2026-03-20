import { auth } from "@clerk/nextjs/server";
import { db, secureShares } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId, encryptedShareData, shareIv, expiresAt, maxViews } = await req.json();

  const [share] = await db
    .insert(secureShares)
    .values({
      itemId,
      createdBy:          userId,
      encryptedShareData,
      shareIv,
      expiresAt:          new Date(expiresAt),
      maxViews:           maxViews ?? 1,
    })
    .returning();

  return Response.json(share, { status: 201 });
}
