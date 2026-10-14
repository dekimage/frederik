import { auth } from "@/app/firebaseAdmin";

export function getAllowedAdminEmails() {
  const raw = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function verifyAdminRequest(request) {
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!bearer) {
    return { ok: false, status: 401, error: "Missing authorization token." };
  }

  const apiSecret = process.env.ADMIN_API_SECRET;
  if (apiSecret && bearer === apiSecret) {
    return { ok: true, email: getAllowedAdminEmails()[0] || "admin" };
  }

  try {
    const decoded = await auth.verifyIdToken(bearer);
    const email = (decoded.email || "").toLowerCase();
    const allowed = getAllowedAdminEmails();

    if (!email || (allowed.length > 0 && !allowed.includes(email))) {
      return { ok: false, status: 403, error: "Not authorized for admin access." };
    }

    return { ok: true, email, uid: decoded.uid };
  } catch {
    return { ok: false, status: 401, error: "Invalid authorization token." };
  }
}

export async function requireAdmin(request) {
  const result = await verifyAdminRequest(request);
  if (!result.ok) {
    return {
      response: Response.json({ error: result.error }, { status: result.status }),
    };
  }
  return { admin: result };
}
