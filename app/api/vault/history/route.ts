import { auth } from "@clerk/nextjs/server";
import { db, itemHistory } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId, encryptedData, iv } = await req.json();

  const [entry] = await db
    .insert(itemHistory)
    .values({ itemId, ownerId: userId, encryptedData, iv })
    .returning();

  return Response.json(entry, { status: 201 });
}
