import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { isLocalhostRequest } from "@/lib/localhost";
import {
  cleanupExpiredPendingOrders,
  getPendingOrdersDevStats,
} from "@/lib/cleanupPendingOrders";

export async function GET(request) {
  const authResult = await requireAdmin(request);
  if (authResult.response) return authResult.response;

  if (!isLocalhostRequest(request)) {
    return NextResponse.json(
      { error: "Dev tools are only available on localhost." },
      { status: 403 }
    );
  }

  try {
    const stats = await getPendingOrdersDevStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Pending orders stats failed:", error.message);
    return NextResponse.json({ error: "Unable to load stats." }, { status: 500 });
  }
}

export async function POST(request) {
  const authResult = await requireAdmin(request);
  if (authResult.response) return authResult.response;

  if (!isLocalhostRequest(request)) {
    return NextResponse.json(
      { error: "Dev tools are only available on localhost." },
      { status: 403 }
    );
  }

  try {
    const statsBefore = await getPendingOrdersDevStats();
    const result = await cleanupExpiredPendingOrders();
    const statsAfter = await getPendingOrdersDevStats();

    return NextResponse.json({
      ...result,
      statsBefore,
      statsAfter,
      message:
        result.deleted > 0
          ? `Removed ${result.deleted} expired pending checkout(s).`
          : "No expired pending checkouts to remove.",
    });
  } catch (error) {
    console.error("Pending order cleanup failed:", error.message);
    return NextResponse.json({ error: "Cleanup failed." }, { status: 500 });
  }
}
