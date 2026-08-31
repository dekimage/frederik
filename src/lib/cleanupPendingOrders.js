import { firestore } from "@/app/firebaseAdmin";

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_MAX_BATCHES = 50;

/**
 * Deletes expired documents from `pendingOrders` in batches.
 * Safe to run manually — only removes rows past `expiresAt`.
 */
export async function cleanupExpiredPendingOrders({
  batchSize = DEFAULT_BATCH_SIZE,
  maxBatches = DEFAULT_MAX_BATCHES,
} = {}) {
  const now = new Date();
  let deleted = 0;
  let batches = 0;

  while (batches < maxBatches) {
    const snapshot = await firestore
      .collection("pendingOrders")
      .where("expiresAt", "<=", now)
      .limit(batchSize)
      .get();

    if (snapshot.empty) break;

    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    deleted += snapshot.size;
    batches += 1;

    if (snapshot.size < batchSize) break;
  }

  return { deleted, batches };
}

export async function getPendingOrdersDevStats() {
  const now = new Date();
  const allSnapshot = await firestore.collection("pendingOrders").get();
  let expired = 0;
  let active = 0;

  allSnapshot.docs.forEach((doc) => {
    const expiresAt = doc.data()?.expiresAt?.toDate?.();
    if (expiresAt && expiresAt <= now) expired += 1;
    else active += 1;
  });

  return {
    total: allSnapshot.size,
    expired,
    active,
  };
}
