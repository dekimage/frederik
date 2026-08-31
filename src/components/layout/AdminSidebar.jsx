"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { isLocalhostHostname } from "@/lib/localhost";
import {
  HomeIcon,
  ImageIcon,
  PackageIcon,
  ShoppingCartIcon,
  WrenchIcon,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: HomeIcon },
  { name: "Images", href: "/admin/images", icon: ImageIcon },
  { name: "Products", href: "/admin/products", icon: PackageIcon },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCartIcon },
];

const devToolsNav = {
  name: "Dev tools",
  href: "/admin/dev-tools",
  icon: WrenchIcon,
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const [showDevTools, setShowDevTools] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShowDevTools(isLocalhostHostname(window.location.hostname));
    }
  }, []);

  const items = showDevTools ? [...navigation, devToolsNav] : navigation;

  return (
    <div className="h-full border-r border-gray-200 bg-black">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-semibold mr-4">Admin Panel</h1>
      </div>
      <nav className="space-y-1 px-3 py-4">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
