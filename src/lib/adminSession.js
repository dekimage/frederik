import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "wolfskin_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function getSessionKey() {
  const password = process.env.ADMIN_PASSWORD || "";
  return createHash("sha256")
    .update(`wolfskin-admin-session:${password}`)
    .digest();
}

function sign(encodedPayload) {
  return createHmac("sha256", getSessionKey())
    .update(encodedPayload)
    .digest("base64url");
}

export function createAdminSession(email) {
  const payload = Buffer.from(
    JSON.stringify({
      email: email.toLowerCase(),
      expiresAt: Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
    })
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSession(token) {
  if (!token || !process.env.ADMIN_PASSWORD) return null;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const expectedSignature = sign(payload);
  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );
    if (
      typeof session.email !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getAdminSessionCookie(token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${ADMIN_SESSION_MAX_AGE_SECONDS}${secure}`;
}

export function getExpiredAdminSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export function readCookie(request, name) {
  const cookieHeader = request.headers.get("cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const cookieName = part.slice(0, separator).trim();
    if (cookieName === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return null;
}
