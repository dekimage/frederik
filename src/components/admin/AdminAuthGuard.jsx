"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ui/themeButton";
import {
  hasVerifiedAdminSession,
  markAdminSessionVerified,
  verifyAdminSessionOnce,
} from "@/lib/adminSessionClient";

export default function AdminAuthGuard({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(() => !hasVerifiedAdminSession());
  const [authorized, setAuthorized] = useState(() => hasVerifiedAdminSession());

  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      if (hasVerifiedAdminSession()) {
        setAuthorized(true);
        setChecking(false);
        return;
      }

      try {
        const isAuthorized = await verifyAdminSessionOnce();
        if (cancelled) return;
        if (!isAuthorized) {
          setAuthorized(false);
          router.replace("/admin/login");
          return;
        }
        setAuthorized(true);
      } catch {
        if (cancelled) return;
        setAuthorized(false);
        router.replace("/admin/login");
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Checking admin access…
      </div>
    );
  }

  if (!authorized) return null;

  return children;
}

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const loginResponse = await fetch("/api/admin/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginResult = await loginResponse.json().catch(() => ({}));

      if (!loginResponse.ok || !loginResult.ok) {
        setError(loginResult.error || "Invalid email or password.");
        return;
      }

      markAdminSessionVerified();
      router.replace("/admin/orders");
      router.refresh();
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 relative">
      <div className="absolute right-6 top-6">
        <ModeToggle />
      </div>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-card text-card-foreground border rounded-lg p-8 space-y-4 shadow-sm"
      >
        <h1 className="text-2xl font-bold">Admin login</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with the admin email and password configured for this shop.
        </p>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
