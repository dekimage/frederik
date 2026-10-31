import { Suspense } from "react";
import TrackOrderClient from "./TrackOrderClient";
import StorefrontLoading from "@/components/StorefrontLoading";

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<StorefrontLoading />}>
      <TrackOrderClient />
    </Suspense>
  );
}
