"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import OrderDetailsDialog from "./OrderDetailsDialog";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCurrencyEUR,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  STRIPE_MODE,
  deriveStripeMode,
} from "@/lib/orderUtils";

function OrderActions({ order, onFulfillmentChange, onOrderStatusChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center space-x-4">
      <Switch
        checked={order.isFulfilled || false}
        onCheckedChange={(checked) => {
          onFulfillmentChange(order.id, checked);
        }}
      />
      <Select
        value={order.orderStatus || ORDER_STATUS.PROCESSING}
        onValueChange={(value) => onOrderStatusChange(order.id, value)}
      >
        <SelectTrigger className="w-[150px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(ORDER_STATUS).map((status) => (
            <SelectItem key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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

const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch (error) {
    return "No date available";
  }
};

export const createColumns = (onFulfillmentChange, onOrderStatusChange) => [
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ row }) => row.original.id || "N/A",
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => {
      const shipping = row.original.shippingDetails || {};
      const billing = row.original.billingDetails || {};
      return (
        `${shipping.firstName || billing.firstName || ""} ${shipping.lastName || billing.lastName || ""}`.trim() ||
        "N/A"
      );
    },
  },
  {
    accessorKey: "stripeMode",
    header: "Stripe mode",
    cell: ({ row }) => {
      const mode = deriveStripeMode(row.original);
      const className =
        mode === STRIPE_MODE.LIVE
          ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
          : mode === STRIPE_MODE.TEST
            ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
            : "bg-muted text-muted-foreground";
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${className}`}>
          {mode.toUpperCase()}
        </span>
      );
    },
  },
  {
    accessorKey: "amountTotal",
    header: "Total",
    cell: ({ row }) => formatCurrencyEUR(row.original.amountTotal),
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => {
      const status = row.original.paymentStatus || "pending";
      const colors = {
        paid: "bg-green-100 text-green-800",
        pending: "bg-yellow-100 text-yellow-800",
        failed: "bg-red-100 text-red-800",
        refunded: "bg-purple-100 text-purple-800",
      };

      return (
        <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || colors.pending}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    },
  },
  {
    accessorKey: "orderStatus",
    header: "Order status",
    cell: ({ row }) =>
      ORDER_STATUS_LABELS[row.original.orderStatus] ||
      row.original.orderStatus ||
      "N/A",
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    accessorKey: "isFulfilled",
    header: "Actions",
    cell: ({ row }) => (
      <OrderActions
        order={row.original}
        onFulfillmentChange={onFulfillmentChange}
        onOrderStatusChange={onOrderStatusChange}
      />
    ),
  },
];
