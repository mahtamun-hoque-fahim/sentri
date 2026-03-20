import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db, vaultInvites, profiles } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Get current user email
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.clerkUserId, userId),
  });

  if (!profile) return Response.json([]);

  // Get invites for this user's email
  const invites = await db.query.vaultInvites.findMany({
    where: eq(vaultInvites.email, profile.email),
    orderBy: [desc(vaultInvites.createdAt)],
  });

  return Response.json(invites);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { vaultId, email } = await req.json();

  const [invite] = await db
    .insert(vaultInvites)
    .values({ vaultId, email: email.toLowerCase().trim(), createdBy: userId })
    .returning();

  return Response.json(invite, { status: 201 });
}
