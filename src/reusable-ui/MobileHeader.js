import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  Gamepad2,
  GaugeCircle,
  LayoutDashboard,
  MenuIcon,
  Search,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import MobxStore from "@/mobx";
import { observer } from "mobx-react";
import { VerticalNavbar } from "./VerticalNavbar";
import { usePathname } from "next/navigation";

const MobileHeader = observer(() => {
  const { isMobileOpen, setIsMobileOpen } = MobxStore;

  const toggleMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const pathname = usePathname();
  const isRoute = (route) => {
    return pathname.endsWith(route.toLowerCase()) ? "default" : "ghost";
  };

  return (
    <div className="flex justify-between items-center border-b relative h-[52px] z-10000 p-4">
      <div className="font-bold">Story RPG</div>
      <Button onClick={toggleMenu} className="p-2">
        {isMobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MenuIcon className="h-6 w-6" />
        )}
      </Button>

      {isMobileOpen && (
        <div className="absolute top-[52px] left-0 w-full h-screen flex flex-col items-start p-4 bg-white">
          {/* List of menu items */}
          <VerticalNavbar
            links={[
              {
                title: "Dashboard",
                icon: LayoutDashboard,
                variant: isRoute("/"),
                href: "/",
                callBack: () => setIsMobileOpen(false),
              },
              {
                title: "Today",
                icon: CalendarCheck,
                variant: isRoute("Today"),
                href: "/today",
                callBack: () => setIsMobileOpen(false),
              },
              {
                title: "Explore",
                icon: Search,
                variant: isRoute("Explore"),
                href: "/explore",
                callBack: () => setIsMobileOpen(false),
              },
              {
                title: "Analytics",
                icon: GaugeCircle,
                variant: isRoute("Analytics"),
                href: "/analytics",
                callBack: () => setIsMobileOpen(false),
              },
              {
                title: "Gamify",
                icon: Gamepad2,
                variant: isRoute("Gamify"),
                href: "/gamify",
                callBack: () => setIsMobileOpen(false),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
});

export default MobileHeader;
