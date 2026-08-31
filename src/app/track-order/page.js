import { Suspense } from "react";
import TrackOrderClient from "./TrackOrderClient";

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-black text-white min-h-screen flex items-center justify-center">
          Loading…
        </div>
      }
    >
      <TrackOrderClient />
    </Suspense>
  );
}
