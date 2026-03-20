import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db, vaults } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const list = await db.query.vaults.findMany({
    where: eq(vaults.ownerId, userId),
    orderBy: [desc(vaults.createdAt)],
  });

  return Response.json(list);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { name, vaultType } = await req.json();

  const [vault] = await db
    .insert(vaults)
    .values({ ownerId: userId, name, vaultType: vaultType ?? "personal" })
    .returning();

  return Response.json(vault, { status: 201 });
}
