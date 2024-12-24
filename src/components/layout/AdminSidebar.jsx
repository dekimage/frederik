import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  ImageIcon,
  PackageIcon,
  ShoppingCartIcon,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: HomeIcon },
  { name: "Images", href: "/admin/images", icon: ImageIcon },
  { name: "Products", href: "/admin/products", icon: PackageIcon },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCartIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="h-full border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-semibold">Admin Panel</h1>
      </div>
      <nav className="space-y-1 px-3 py-4">
        {navigation.map((item) => {
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
