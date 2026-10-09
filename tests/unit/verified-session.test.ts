import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { resolveAccountingPrincipal } from "../../src/lib/accounting/verified-session";

const token = "a".repeat(40);
const active = {
  userId: "actor",
  expiresAt: new Date("2099-01-01"),
  membership: { active: true, userId: "actor", organizationId: "org", role: "CFO" },
};

describe("accounting session identity", () => {
  it("derives organization and actor from a persisted active session", async () => {
    const findUnique = vi.fn().mockResolvedValue(active);
    const db = { session: { findUnique } };
    await expect(resolveAccountingPrincipal(db as never, token)).resolves.toEqual({
      userId: "actor", organizationId: "org", role: "CFO",
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { tokenHash: createHash("sha256").update(token).digest("hex") },
      include: { membership: true },
    });
  });
  it("rejects expired or mismatched membership", async () => {
    for (const record of [
      { ...active, expiresAt: new Date("2020-01-01") },
      { ...active, membership: { ...active.membership, userId: "other" } },
      { ...active, membership: { ...active.membership, active: false } },
    ]) {
      const db = { session: { findUnique: vi.fn().mockResolvedValue(record) } };
      await expect(resolveAccountingPrincipal(db as never, token)).rejects.toThrow("AUTHENTICATION_REQUIRED");
    }
  });
  it("rejects missing session token without a database lookup", async () => {
    const findUnique = vi.fn();
    await expect(resolveAccountingPrincipal({ session: { findUnique } } as never, ""))
      .rejects.toThrow("AUTHENTICATION_REQUIRED");
    expect(findUnique).not.toHaveBeenCalled();
  });
});
