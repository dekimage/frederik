"use client";

import { cn } from "@/lib/utils";
import AdminSidebar from "./AdminSidebar";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";

export default function AdminLayout({ children }) {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-black font-mono">
        <div className="flex h-screen">
          <div className="w-64 flex-shrink-0">
            <AdminSidebar />
          </div>
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
