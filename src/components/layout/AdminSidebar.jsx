"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { isLocalhostHostname } from "@/lib/localhost";
import {
  HomeIcon,
  ImageIcon,
  PackageIcon,
  ShoppingCartIcon,
  WrenchIcon,
  LogOutIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/themeButton";
import { clearAdminSessionVerification } from "@/lib/adminSessionClient";

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
  const router = useRouter();
  const [showDevTools, setShowDevTools] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShowDevTools(isLocalhostHostname(window.location.hostname));
    }
  }, []);

  const items = showDevTools ? [...navigation, devToolsNav] : navigation;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      clearAdminSessionVerification();
      router.replace("/admin/login");
      router.refresh();
      setLoggingOut(false);
    }
  };

  return (
    <div className="h-full border-r bg-background text-foreground flex flex-col">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-semibold mr-4">Admin Panel</h1>
      </div>
      <nav className="space-y-1 px-3 py-4 flex-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">Appearance</span>
          <ModeToggle />
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOutIcon className="mr-3 h-4 w-4" />
          {loggingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </div>
  );
}
