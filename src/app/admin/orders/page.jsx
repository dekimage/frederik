"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
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

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "all",
    isFulfilled: "all",
    search: "",
  });

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/admin/orders`);
      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleFulfillmentChange = async (orderId, isFulfilled) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isFulfilled }),
      });

      if (!response.ok) throw new Error("Failed to update order");
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  // Filter orders on the frontend
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filters.status === "all" || order.paymentStatus === filters.status;
    const matchesFulfillment =
      filters.isFulfilled === "all" ||
      order.isFulfilled === (filters.isFulfilled === "true");
    const searchTerm = filters.search.toLowerCase();
    const matchesSearch =
      !filters.search ||
      order.id.toLowerCase().includes(searchTerm) ||
      order.billingDetails?.firstName?.toLowerCase().includes(searchTerm) ||
      order.billingDetails?.lastName?.toLowerCase().includes(searchTerm) ||
      order.billingDetails?.email?.toLowerCase().includes(searchTerm);

    return matchesStatus && matchesFulfillment && matchesSearch;
  });

  // Calculate pagination
  const itemsPerPage = 100;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const columns = createColumns(handleFulfillmentChange);

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4">Orders</h1>

          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by order ID, name or email..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="max-w-xs"
            />

            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
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

        {loading ? (
          <div className="text-center py-4">Loading orders...</div>
        ) : (
          <>
            <DataTable columns={columns} data={paginatedOrders} />

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
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
    </AdminLayout>
  );
}
