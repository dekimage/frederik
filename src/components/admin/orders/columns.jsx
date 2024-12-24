"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import OrderDetailsDialog from "./OrderDetailsDialog";
import { useState } from "react";

// Separate component for the actions cell
function OrderActions({ order, onFulfillmentChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center space-x-4">
      <Switch
        checked={order.isFulfilled || false}
        onCheckedChange={(checked) => {
          onFulfillmentChange(order.id, checked);
        }}
      />
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        View Details
      </Button>
      <OrderDetailsDialog
        order={order}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </div>
  );
}

// Helper function to format currency
const formatCurrency = (value) => {
  if (typeof value === "string") {
    value = parseFloat(value);
  }
  return typeof value === "number" && !isNaN(value)
    ? `$${value.toFixed(2)}`
    : "$0.00";
};

// Helper function to format date
const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch (error) {
    return "No date available";
  }
};

export const createColumns = (onFulfillmentChange) => [
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ row }) => row.original.id || "N/A",
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => {
      const billing = row.original.billingDetails || {};
      return (
        `${billing.firstName || ""} ${billing.lastName || ""}`.trim() || "N/A"
      );
    },
  },
  {
    accessorKey: "amountTotal",
    header: "Total",
    cell: ({ row }) => formatCurrency(row.original.amountTotal),
  },
  {
    accessorKey: "paymentStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.paymentStatus || "pending";
      const colors = {
        paid: "bg-green-100 text-green-800",
        pending: "bg-yellow-100 text-yellow-800",
        failed: "bg-red-100 text-red-800",
      };

      return (
        <span className={`px-2 py-1 rounded-full text-xs ${colors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    accessorKey: "isFulfilled",
    header: "Fulfilled",
    cell: ({ row }) => (
      <OrderActions
        order={row.original}
        onFulfillmentChange={onFulfillmentChange}
      />
    ),
  },
];
