import { firestore } from "@/app/firebaseAdmin";
import { withAdminRoute } from "@/lib/withAdminRoute";
import { STRIPE_MODE, deriveStripeMode } from "@/lib/orderUtils";

export async function GET(request) {
  return withAdminRoute(request, async () => {
    try {
      const [categories, products, images, orders] = await Promise.all([
        firestore.collection("categories").get(),
        firestore.collection("products").get(),
        firestore.collection("images").get(),
        firestore.collection("orders").get(),
      ]);

      const activeOrders = orders.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((order) => !order.archivedAt);
      const liveOrders = activeOrders.filter(
        (order) => deriveStripeMode(order) === STRIPE_MODE.LIVE
      );
      const testOrders = activeOrders.filter(
        (order) => deriveStripeMode(order) === STRIPE_MODE.TEST
      );

      const livePaidRevenue = liveOrders
        .filter((order) => order.paymentStatus === "paid")
        .reduce((sum, order) => sum + Number(order.amountTotal || 0), 0);

      const pendingFulfillment = liveOrders.filter(
        (order) =>
          order.paymentStatus === "paid" &&
          !order.isFulfilled &&
          !["cancelled", "refunded", "payment_failed", "expired"].includes(
            order.orderStatus
          )
      ).length;

      const emailFailures = activeOrders.filter(
        (order) => order.emailDelivery?.status === "failed"
      ).length;

      return Response.json({
        stats: {
          categories: categories.size,
          products: products.size,
          draftProducts: products.docs.filter(
            (doc) => doc.data().published === false
          ).length,
          images: images.size,
          activeOrders: activeOrders.length,
          liveOrders: liveOrders.length,
          testOrders: testOrders.length,
          livePaidRevenue,
          pendingFulfillment,
          emailFailures,
        },
      });
    } catch (error) {
      console.error("Error loading admin dashboard:", error);
      return Response.json(
        { error: "Unable to load dashboard statistics." },
        { status: 500 }
      );
    }
  });
}
