"use client";

import { usePathname } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminRouteLayout({ children }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") return children;

  return <AdminLayout>{children}</AdminLayout>;
}
