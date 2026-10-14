import { createHash, timingSafeEqual } from "node:crypto";
import { getAllowedAdminEmails } from "@/lib/adminAuth";
import {
  createAdminSession,
  getAdminSessionCookie,
} from "@/lib/adminSession";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const attemptStore =
  globalThis.__wolfskinAdminPasswordAttempts ||
  (globalThis.__wolfskinAdminPasswordAttempts = new Map());

function getClientKey(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getAttempts(key) {
  const now = Date.now();
  const current = attemptStore.get(key);
  if (!current || now - current.startedAt >= ATTEMPT_WINDOW_MS) {
    const fresh = { count: 0, startedAt: now };
    attemptStore.set(key, fresh);
    return fresh;
  }
  return current;
}

function recordFailure(key) {
  const attempts = getAttempts(key);
  attempts.count += 1;
  attemptStore.set(key, attempts);
}

function passwordsMatch(received, expected) {
  const receivedHash = createHash("sha256").update(received).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(receivedHash, expectedHash);
}

function json(body, status, headers = {}) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export async function POST(request) {
  const configuredPassword = process.env.ADMIN_PASSWORD || "";
  const allowedEmails = getAllowedAdminEmails();

  if (allowedEmails.length === 0 || configuredPassword.length < 12) {
    return json(
      {
        error:
          "Admin login is not configured. Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.",
      },
      503
    );
  }

  const clientKey = getClientKey(request);
  const attempts = getAttempts(clientKey);
  if (attempts.count >= MAX_ATTEMPTS) {
    return json(
      { error: "Too many login attempts. Please try again in 15 minutes." },
      429
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    recordFailure(clientKey);
    return json({ error: "Invalid email or password." }, 401);
  }

  const email = (body?.email || "").toString().trim().toLowerCase();
  const password = (body?.password || "").toString();
  const validCredentials =
    allowedEmails.includes(email) && passwordsMatch(password, configuredPassword);

  if (!validCredentials) {
    recordFailure(clientKey);
    return json({ error: "Invalid email or password." }, 401);
  }

  const token = createAdminSession(email);
  attemptStore.delete(clientKey);
  return json(
    { ok: true, email },
    200,
    { "Set-Cookie": getAdminSessionCookie(token) }
  );
}
