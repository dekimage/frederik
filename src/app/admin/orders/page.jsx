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
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    paymentStatus: "all",
    stripeMode: "all",
    orderStatus: "all",
    isFulfilled: "all",
    search: "",
  });

  const fetchOrders = async () => {
    setError("");
    try {
      const response = await adminFetch(`/api/admin/orders`);
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
      matchesSearch
    );
  });

  const itemsPerPage = 100;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const columns = createColumns(handleFulfillmentChange, handleOrderStatusChange);

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>

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
