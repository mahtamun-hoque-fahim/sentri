import { eq } from "drizzle-orm";
import { db, secureShares } from "@/lib/db";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ shareId: string }> };

// Public route — no auth required
export async function GET(_req: NextRequest, { params }: Params) {
  const { shareId } = await params;

  const share = await db.query.secureShares.findFirst({
    where: eq(secureShares.id, shareId),
  });

  if (!share) return Response.json({ error: "Not found" }, { status: 404 });

  if (new Date(share.expiresAt) < new Date())
    return Response.json({ error: "expired" }, { status: 410 });

  if ((share.viewCount ?? 0) >= (share.maxViews ?? 1))
    return Response.json({ error: "exhausted" }, { status: 410 });

  // Increment view count
  await db
    .update(secureShares)
    .set({ viewCount: (share.viewCount ?? 0) + 1 })
    .where(eq(secureShares.id, shareId));

  return Response.json({
    id:                  share.id,
    encryptedShareData:  share.encryptedShareData,
    shareIv:             share.shareIv,
    expiresAt:           share.expiresAt,
    viewsLeft:           (share.maxViews ?? 1) - (share.viewCount ?? 0) - 1,
  });
}
