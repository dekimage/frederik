import { firestore } from "@/app/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request, { params }) {
  const authResult = await requireAdmin(request);
  if (authResult.response) return authResult.response;

  const order = await firestore.collection("orders").doc(params.id).get();
  if (!order.exists) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  const html = order.data().invoice?.html;
  if (!html) {
    return Response.json(
      { error: "This order has no stored HTML invoice." },
      { status: 404 }
    );
  }

  const download = new URL(request.url).searchParams.get("download") === "1";
  const disposition = download ? "attachment" : "inline";

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `${disposition}; filename="invoice-${params.id}.html"`,
      "Cache-Control": "private, no-store",
      "Content-Security-Policy":
        "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src https: data:; frame-ancestors 'self'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
