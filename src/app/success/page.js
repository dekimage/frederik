"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import MobxStore from "@/mobx";

const Success = observer(() => {
  useEffect(() => {
    MobxStore.clearCart();
  }, []);

  return (
    <div className="text-center text-white h-screen flex justify-center items-center flex-col">
      <h1 className="text-4xl font-bold my-8">Payment Successful!</h1>
      <p>Thank you for your purchase. Your order is being processed.</p>
      <p>Check your email for order details.</p>
      <Link href="/" className="mt-8">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
});

export default Success;
