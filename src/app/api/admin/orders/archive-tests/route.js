import { admin, firestore } from "@/app/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { STRIPE_MODE, deriveStripeMode } from "@/lib/orderUtils";

const MAX_ARCHIVE_BATCH = 400;

export async function POST(request) {
  const authResult = await requireAdmin(request);
  if (authResult.response) return authResult.response;

  try {
    const snapshot = await firestore.collection("orders").get();
    const candidates = snapshot.docs.filter((doc) => {
      const order = doc.data();
      return !order.archivedAt && deriveStripeMode(order) === STRIPE_MODE.TEST;
    });
    const selected = candidates.slice(0, MAX_ARCHIVE_BATCH);

    if (selected.length === 0) {
      return Response.json({ archived: 0, remaining: 0 });
    }

    const batch = firestore.batch();
    for (const doc of selected) {
      batch.update(doc.ref, {
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        archivedBy: authResult.admin.email,
        archiveReason: "admin:test-order-cleanup",
      });
    }
    await batch.commit();

    return Response.json({
      archived: selected.length,
      remaining: Math.max(0, candidates.length - selected.length),
    });
  } catch (error) {
    console.error("Test-order archive failed:", error);
    return Response.json(
      { error: "Unable to archive test orders." },
      { status: 500 }
    );
  }
}
