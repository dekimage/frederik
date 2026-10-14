"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminAuthGuard({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      try {
        const response = await fetch("/api/admin/auth/verify", {
          cache: "no-store",
        });
        if (cancelled) return;
        if (!response.ok) {
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
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

      const response = await fetch("/api/admin/auth/verify", {
        cache: "no-store",
      });

      if (!response.ok) {
        setError("The admin session could not be verified.");
        return;
      }

      router.replace("/admin/orders");
      router.refresh();
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg p-8 space-y-4"
      >
        <h1 className="text-2xl font-bold">Admin login</h1>
        <p className="text-sm text-gray-400">
          Sign in with the admin email and password configured for this shop.
        </p>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-gray-800 border-gray-600"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-gray-800 border-gray-600"
        />
        {error ? <p className="text-red-400 text-sm">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
