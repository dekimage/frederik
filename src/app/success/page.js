import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-white h-screen flex justify-center items-center">
          Loading…
        </div>
      }
    >
      <SuccessClient />
    </Suspense>
  );
}
