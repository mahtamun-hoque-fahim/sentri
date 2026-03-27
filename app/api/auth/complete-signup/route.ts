import { NextRequest } from "next/server";
import { verifyToken } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, profiles, vaults } from "@/lib/db";

/**
 * POST /api/auth/complete-signup
 *
 * Called during the signup flow right after setActive() resolves.
 * The client obtains a JWT via session.getToken() and passes it as a
 * Bearer token. This avoids depending on the session cookie which may
 * not have propagated to the browser yet at this point in the flow.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Missing session token" }, { status: 401 });
    }

    const sessionToken = authHeader.slice(7);

    // Verify the JWT and extract the userId (sub claim)
    const payload = await verifyToken(sessionToken, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    const userId = payload.sub;
    if (!userId) {
      return Response.json({ error: "Invalid session token" }, { status: 401 });
    }

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
  } catch (err) {
    console.error("[complete-signup] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
