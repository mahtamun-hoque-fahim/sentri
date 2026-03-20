import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, profiles, vaults } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.clerkUserId, userId),
  });

  if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });
  return Response.json(profile);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { email, secretKeyHint, encryptedVaultKey, vaultKeySalt, vaultKeyIv } = body;

  // Upsert profile
  const [profile] = await db
    .insert(profiles)
    .values({ clerkUserId: userId, email, secretKeyHint, encryptedVaultKey, vaultKeySalt, vaultKeyIv })
    .onConflictDoUpdate({
      target: profiles.clerkUserId,
      set: { encryptedVaultKey, vaultKeySalt, vaultKeyIv },
    })
    .returning();

  // Create default personal vault if first time
  const existing = await db.query.vaults.findFirst({
    where: eq(vaults.ownerId, userId),
  });

  if (!existing) {
    await db.insert(vaults).values({ ownerId: userId, name: "Personal", vaultType: "personal" });
  }

  return Response.json(profile, { status: 201 });
}
