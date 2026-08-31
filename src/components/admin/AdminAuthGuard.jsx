"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminAuthGuard({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthorized(false);
        setChecking(false);
        router.replace("/admin/login");
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/admin/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          await signOut(auth);
          setAuthorized(false);
          router.replace("/admin/login");
          return;
        }
        setAuthorized(true);
      } catch {
        setAuthorized(false);
        router.replace("/admin/login");
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
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
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();
      const response = await fetch("/api/admin/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        await signOut(auth);
        setError("This account is not authorized for admin access.");
        return;
      }

      router.replace("/admin/orders");
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
          Sign in with the Firebase admin account listed in `ADMIN_EMAIL`.
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
