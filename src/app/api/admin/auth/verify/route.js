import { verifyAdminRequest } from "@/lib/adminAuth";

export async function GET(request) {
  const result = await verifyAdminRequest(request);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true, email: result.email });
}
