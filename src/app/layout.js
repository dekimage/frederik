"use client";
import { ThemeProvider } from "@/components/theme-provider";
import "../globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

const categories = [
  { id: "spring", name: "Spring" },
  { id: "summer", name: "Summer" },
  { id: "autumn", name: "Autumn" },
  { id: "winter", name: "Winter" },
];

// Routes where we don't want to show header/footer
const excludedRoutes = ["/admin"];

export default function RootLayout({ children }) {
  const pathname = usePathname();

  const shouldExclude = excludedRoutes.some((route) =>
    pathname?.startsWith(route)
  );

  return (
    <html lang="en">
      <head></head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          {!shouldExclude && <Header categories={categories} />}
          {children}
          {!shouldExclude && <Footer />}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
