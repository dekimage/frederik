import { Suspense } from "react";
import SuccessClient from "./SuccessClient";
import StorefrontLoading from "@/components/StorefrontLoading";

export default function SuccessPage() {
  return (
    <Suspense fallback={<StorefrontLoading />}>
      <SuccessClient />
    </Suspense>
  );
}
