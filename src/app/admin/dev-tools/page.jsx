"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/adminFetch";
import { isLocalhostHostname } from "@/lib/localhost";

function DevToolsContent() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const loadStats = async () => {
    setLoadingStats(true);
    setError("");
    try {
      const response = await adminFetch("/api/admin/dev-tools/cleanup-pending-orders");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load stats.");
      setStats(data.stats);
    } catch (err) {
      setError(err.message || "Unable to load stats.");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const runCleanup = async () => {
    setRunning(true);
    setError("");
    setResult(null);

    try {
      const response = await adminFetch("/api/admin/dev-tools/cleanup-pending-orders", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Cleanup failed.");
      setResult(data);
      setStats(data.statsAfter);
    } catch (err) {
      setError(err.message || "Cleanup failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Dev tools</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Localhost only. Run maintenance tasks manually when needed — for example
        once a month to remove abandoned checkout sessions that were never paid.
      </p>

      <div className="bg-card text-card-foreground border rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Pending checkout cleanup</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Deletes expired rows from Firestore <code>pendingOrders</code> (unpaid
            Stripe sessions past their 24-hour expiry). Paid orders in{" "}
            <code>orders</code> are not touched.
          </p>

          {loadingStats ? (
            <p className="text-sm text-muted-foreground">Loading counts…</p>
          ) : stats ? (
            <ul className="text-sm space-y-1 mb-4 tabular-nums">
              <li>Total pending checkouts: {stats.total}</li>
              <li>Expired (will be removed): {stats.expired}</li>
              <li>Still active: {stats.active}</li>
            </ul>
          ) : null}

          <Button onClick={runCleanup} disabled={running}>
            {running ? "Running cleanup…" : "Run cleanup now"}
          </Button>

          {result ? (
            <p className="text-sm text-green-600 dark:text-green-400 mt-4">{result.message}</p>
          ) : null}
          {error ? <p className="text-sm text-destructive mt-4">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default function DevToolsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isLocalhostHostname(window.location.hostname)) {
      router.replace("/admin");
      return;
    }
    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Dev tools are only available on localhost.
      </div>
    );
  }

  return <DevToolsContent />;
}
