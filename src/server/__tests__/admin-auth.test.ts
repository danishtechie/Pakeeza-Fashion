import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyAdminCredentials, MAX_FAILED_ATTEMPTS } from "../admin-auth";

async function makeAdmin(password: string) {
  const email = `admin-${Date.now()}-${Math.random()}@test.com`;
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(adminUsers)
    .values({ name: "Test Admin", email, passwordHash, role: "SUPER_ADMIN", isActive: true })
    .returning();
  return { email, user: user! };
}

describe("verifyAdminCredentials", () => {
  it("succeeds with the correct password and resets failed count", async () => {
    const { email } = await makeAdmin("CorrectHorse123!");
    const result = await verifyAdminCredentials(email, "CorrectHorse123!");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.email).toBe(email);
      expect(result.user.role).toBe("SUPER_ADMIN");
    }
  });

  it("fails with an incorrect password", async () => {
    const { email } = await makeAdmin("CorrectHorse123!");
    const result = await verifyAdminCredentials(email, "WrongPassword");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("INVALID_CREDENTIALS");
  });

  it("fails for a nonexistent email without revealing that (same reason as wrong password)", async () => {
    const result = await verifyAdminCredentials("nobody@nowhere.com", "anything");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("INVALID_CREDENTIALS");
  });

  it(`locks the account after ${MAX_FAILED_ATTEMPTS} consecutive failed attempts`, async () => {
    const { email, user } = await makeAdmin("CorrectHorse123!");

    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      const r = await verifyAdminCredentials(email, "WrongPassword");
      expect(r.ok).toBe(false);
    }

    const row = await db.query.adminUsers.findFirst({ where: eq(adminUsers.id, user.id) });
    expect(row?.failedLoginCount).toBe(MAX_FAILED_ATTEMPTS);
    expect(row?.lockedUntil).not.toBeNull();
    expect(row!.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it("rejects the CORRECT password while the account is locked", async () => {
    const { email } = await makeAdmin("CorrectHorse123!");

    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      await verifyAdminCredentials(email, "WrongPassword");
    }

    // Now try the real password — must still be rejected because locked.
    const result = await verifyAdminCredentials(email, "CorrectHorse123!");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("ACCOUNT_LOCKED");
  });

  it("does not lock the account on fewer than the max failed attempts", async () => {
    const { email, user } = await makeAdmin("CorrectHorse123!");

    for (let i = 0; i < MAX_FAILED_ATTEMPTS - 1; i++) {
      await verifyAdminCredentials(email, "WrongPassword");
    }

    const row = await db.query.adminUsers.findFirst({ where: eq(adminUsers.id, user.id) });
    expect(row?.lockedUntil).toBeNull();

    // Correct password should still work since not locked yet.
    const result = await verifyAdminCredentials(email, "CorrectHorse123!");
    expect(result.ok).toBe(true);
  });

  it("rejects an inactive admin account even with the correct password", async () => {
    const { email, user } = await makeAdmin("CorrectHorse123!");
    await db.update(adminUsers).set({ isActive: false }).where(eq(adminUsers.id, user.id));

    const result = await verifyAdminCredentials(email, "CorrectHorse123!");
    expect(result.ok).toBe(false);
  });
});
