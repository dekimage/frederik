import { createHash, timingSafeEqual } from "node:crypto";
import { auth } from "@/app/firebaseAdmin";
import { getAllowedAdminEmails } from "@/lib/adminAuth";

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

function json(body, status) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
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

  try {
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (error) {
      if (error?.code !== "auth/user-not-found") throw error;
      user = await auth.createUser({ email, emailVerified: true });
    }

    if (user.disabled) {
      return json({ error: "This admin account is disabled." }, 403);
    }

    const token = await auth.createCustomToken(user.uid);
    attemptStore.delete(clientKey);
    return json({ token }, 200);
  } catch {
    return json({ error: "Unable to start the admin session." }, 500);
  }
}
