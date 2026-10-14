"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/admin/orders/DataTable";
import { createColumns } from "@/components/admin/orders/columns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArchiveIcon, DownloadIcon } from "lucide-react";
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  STRIPE_MODE,
  deriveStripeMode,
} from "@/lib/orderUtils";
import { adminFetch } from "@/lib/adminFetch";

function OrdersPageContent() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [archivingTests, setArchivingTests] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    paymentStatus: "all",
    stripeMode: "all",
    orderStatus: "all",
    isFulfilled: "all",
    archiveStatus: "active",
    search: "",
  });

  const fetchOrders = async () => {
    setError("");
    try {
      const response = await adminFetch(`/api/admin/orders?limit=500&archive=all`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch orders");
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(error.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleFulfillmentChange = async (orderId, isFulfilled) => {
    try {
      const response = await adminFetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({ isFulfilled }),
      });
      if (!response.ok) throw new Error("Failed to update order");
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      setError(error.message || "Unable to update order.");
    }
  };

  const handleOrderStatusChange = async (orderId, orderStatus) => {
    try {
      const response = await adminFetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({ orderStatus }),
      });
      if (!response.ok) throw new Error("Failed to update order status");
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      setError(error.message || "Unable to update order status.");
    }
  };

  const handleRestore = async (orderId) => {
    try {
      const response = await adminFetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({ isArchived: false }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to restore order");
      setNotice("Order restored.");
      fetchOrders();
    } catch (error) {
      setError(error.message || "Unable to restore order.");
    }
  };

  const handleArchiveTestOrders = async () => {
    if (
      !window.confirm(
        "Archive every active TEST order? They will be hidden from Active orders but remain recoverable under Archived."
      )
    ) {
      return;
    }

    setArchivingTests(true);
    setError("");
    setNotice("");
    try {
      const response = await adminFetch("/api/admin/orders/archive-tests", {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to archive test orders.");
      setNotice(
        data.archived
          ? `${data.archived} TEST order(s) archived. No order data was deleted.`
          : "There are no active TEST orders to archive."
      );
      fetchOrders();
    } catch (error) {
      setError(error.message || "Unable to archive test orders.");
    } finally {
      setArchivingTests(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesPaymentStatus =
      filters.paymentStatus === "all" ||
      order.paymentStatus === filters.paymentStatus;
    const matchesStripeMode =
      filters.stripeMode === "all" ||
      deriveStripeMode(order) === filters.stripeMode;
    const matchesOrderStatus =
      filters.orderStatus === "all" || order.orderStatus === filters.orderStatus;
    const matchesFulfillment =
      filters.isFulfilled === "all" ||
      order.isFulfilled === (filters.isFulfilled === "true");
    const matchesArchive =
      filters.archiveStatus === "all" ||
      (filters.archiveStatus === "archived"
        ? Boolean(order.archivedAt)
        : !order.archivedAt);
    const searchTerm = filters.search.toLowerCase();
    const matchesSearch =
      !filters.search ||
      order.id.toLowerCase().includes(searchTerm) ||
      order.billingDetails?.firstName?.toLowerCase().includes(searchTerm) ||
      order.billingDetails?.lastName?.toLowerCase().includes(searchTerm) ||
      order.billingDetails?.email?.toLowerCase().includes(searchTerm) ||
      order.shippingDetails?.email?.toLowerCase().includes(searchTerm);

    return (
      matchesPaymentStatus &&
      matchesStripeMode &&
      matchesOrderStatus &&
      matchesFulfillment &&
      matchesArchive &&
      matchesSearch
    );
  });

  const itemsPerPage = 100;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const columns = createColumns(
    handleFulfillmentChange,
    handleOrderStatusChange,
    handleRestore
  );

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Orders</h1>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href="/api/admin/orders/export">
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export active CSV
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={handleArchiveTestOrders}
              disabled={archivingTests}
            >
              <ArchiveIcon className="mr-2 h-4 w-4" />
              {archivingTests ? "Archiving…" : "Archive TEST orders"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <Input
            placeholder="Search by order ID, name or email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="max-w-xs"
          />

          <Select
            value={filters.paymentStatus}
            onValueChange={(value) =>
              setFilters({ ...filters, paymentStatus: value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Payment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.archiveStatus}
            onValueChange={(value) =>
              setFilters({ ...filters, archiveStatus: value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Archive status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active orders</SelectItem>
              <SelectItem value="archived">Archived orders</SelectItem>
              <SelectItem value="all">Active + archived</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.orderStatus}
            onValueChange={(value) =>
              setFilters({ ...filters, orderStatus: value })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Order status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All order statuses</SelectItem>
              {Object.values(ORDER_STATUS).map((status) => (
                <SelectItem key={status} value={status}>
                  {ORDER_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.stripeMode}
            onValueChange={(value) =>
              setFilters({ ...filters, stripeMode: value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Stripe mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stripe modes</SelectItem>
              <SelectItem value={STRIPE_MODE.LIVE}>LIVE orders</SelectItem>
              <SelectItem value={STRIPE_MODE.TEST}>TEST orders</SelectItem>
              <SelectItem value={STRIPE_MODE.UNKNOWN}>Unknown mode</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.isFulfilled}
            onValueChange={(value) =>
              setFilters({ ...filters, isFulfilled: value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by fulfillment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="true">Fulfilled</SelectItem>
              <SelectItem value="false">Unfulfilled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {notice ? (
        <div className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : loading ? (
        <div className="text-center py-4">Loading orders...</div>
      ) : (
        <>
          <DataTable columns={columns} data={paginatedOrders} />

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setPage((p) => Math.max(1, Math.min(totalPages, p + 1)))
                }
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return <OrdersPageContent />;
}
