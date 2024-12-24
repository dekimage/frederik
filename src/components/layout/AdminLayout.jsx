import { cn } from "@/lib/utils";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-white font-mono">
      <div className="flex h-screen">
        <div className="w-64 flex-shrink-0">
          <AdminSidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
