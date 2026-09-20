import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;
// Dummy hash used to equalize response time when the email doesn't exist,
// so login doesn't leak which admin emails are registered via timing.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8Dh.5oBBtVIjRTRmVjT1WjQ8fVpWlS";

export type VerifyAdminResult =
  | { ok: true; user: { id: string; name: string; email: string; role: string } }
  | { ok: false; reason: "INVALID_CREDENTIALS" | "ACCOUNT_LOCKED" | "ACCOUNT_INACTIVE" };

/**
 * Verifies admin credentials and enforces brute-force lockout. Extracted
 * from the NextAuth Credentials provider so it can be exercised directly in
 * tests without going through the HTTP/session layer.
 */
export async function verifyAdminCredentials(email: string, password: string): Promise<VerifyAdminResult> {
  const user = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, email.toLowerCase().trim()),
  });

  if (!user || !user.isActive) {
    // Still run a bcrypt compare against a dummy hash so response timing
    // doesn't reveal whether the email is registered.
    await bcrypt.compare(password, DUMMY_HASH);
    return { ok: false, reason: !user ? "INVALID_CREDENTIALS" : "ACCOUNT_INACTIVE" };
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return { ok: false, reason: "ACCOUNT_LOCKED" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    const nextCount = user.failedLoginCount + 1;
    const lockedUntil =
      nextCount >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null;
    await db.update(adminUsers).set({ failedLoginCount: nextCount, lockedUntil }).where(eq(adminUsers.id, user.id));
    return { ok: false, reason: "INVALID_CREDENTIALS" };
  }

  await db
    .update(adminUsers)
    .set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(adminUsers.id, user.id));

  return { ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}
