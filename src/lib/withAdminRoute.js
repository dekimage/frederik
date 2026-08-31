import { requireAdmin } from "@/lib/adminAuth";

export async function withAdminRoute(request, handler) {
  const authResult = await requireAdmin(request);
  if (authResult.response) return authResult.response;
  return handler(authResult.admin);
}
