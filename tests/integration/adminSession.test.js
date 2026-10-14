import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  getAdminSessionCookie,
  readCookie,
  verifyAdminSession,
} from "../../src/lib/adminSession";

describe("admin password sessions", () => {
  const originalPassword = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    process.env.ADMIN_PASSWORD = "test-admin-password-12345";
  });

  afterEach(() => {
    if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = originalPassword;
  });

  it("creates a signed HTTP-only cookie that can be verified", () => {
    const token = createAdminSession("Admin@Example.com");
    const cookie = getAdminSessionCookie(token);
    const request = new Request("https://example.com/api/admin/auth/verify", {
      headers: { cookie },
    });

    const session = verifyAdminSession(
      readCookie(request, ADMIN_SESSION_COOKIE)
    );

    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(session?.email).toBe("admin@example.com");
    expect(session?.expiresAt).toBeGreaterThan(Date.now());
  });

  it("rejects a tampered session", () => {
    const token = createAdminSession("admin@example.com");
    expect(verifyAdminSession(`${token}tampered`)).toBeNull();
  });

  it("invalidates sessions when the admin password changes", () => {
    const token = createAdminSession("admin@example.com");
    process.env.ADMIN_PASSWORD = "a-different-admin-password";
    expect(verifyAdminSession(token)).toBeNull();
  });
});
