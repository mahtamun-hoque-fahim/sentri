import { NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, profiles, vaults } from "@/lib/db";

/**
 * POST /api/auth/complete-signup
 *
 * Called during signup BEFORE setActive() so we avoid the session-cookie
 * timing race. The client sends the Clerk sessionId from signUp.createdSessionId.
 * We verify it server-side via the Clerk backend SDK to get the real userId.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, email, secretKeyHint, encryptedVaultKey, vaultKeySalt, vaultKeyIv } = body;

    if (!sessionId) {
      return Response.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Verify the session via Clerk backend — this is safe server-side only
    const clerk = await clerkClient();
    const clerkSession = await clerk.sessions.getSession(sessionId);

    if (!clerkSession?.userId) {
      return Response.json({ error: "Invalid session" }, { status: 401 });
    }

    const userId = clerkSession.userId;

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
  } catch (err) {
    console.error("[complete-signup] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

