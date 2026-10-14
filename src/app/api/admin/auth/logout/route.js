import { getExpiredAdminSessionCookie } from "@/lib/adminSession";

export async function POST() {
  return Response.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": getExpiredAdminSessionCookie(),
      },
    }
  );
}
