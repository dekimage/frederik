"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import MobxStore from "@/mobx";
import {
  getPdpQuote,
  getCountryLabel,
  listMaterials,
  listSizesForMaterial,
  materialLabel,
  PDP_REFERENCE_COUNTRY,
} from "@/lib/pricingCatalog";

export default function ProductPrintOptions({ productId, product }) {
  const { toast } = useToast();
  const [material, setMaterial] = useState("");
  const [sizeKey, setSizeKey] = useState("");
  const [quantity, setQuantity] = useState(1);

  const mats = useMemo(() => listMaterials(), []);
  const referenceLabel = getCountryLabel(PDP_REFERENCE_COUNTRY);

  const sizeOptions = useMemo(
    () => (material ? listSizesForMaterial(material) : []),
    [material]
  );

  useEffect(() => {
    if (mats.length && !material) setMaterial(mats[0]);
  }, [mats, material]);

  useEffect(() => {
    if (sizeOptions.length) {
      if (!sizeKey || !sizeOptions.some((s) => s.sizeKey === sizeKey)) {
        setSizeKey(sizeOptions[0].sizeKey);
      }
    }
  }, [material, sizeOptions, sizeKey]);

  const quote = useMemo(() => {
    if (!material || !sizeKey) return null;
    return getPdpQuote(material, sizeKey);
  }, [material, sizeKey]);

  const addToCart = () => {
    if (!quote || !quote.available || !Number.isFinite(quote.priceExShipping)) {
      toast({
        title: "Not available",
        description:
          "This combination is not available in the catalogue for the reference market.",
        variant: "destructive",
      });
      return;
    }
    MobxStore.addToCart({
      productId,
      quantity,
      sizeKey: quote.sizeKey,
      sizeRaw: quote.sizeRaw,
      material,
      price: quote.priceExShipping,
    });
    toast({
      title: "Added to Cart",
      description: (
        <div className="flex flex-col gap-2">
          <p className="font-medium">
            {quantity} × {product.name}
          </p>
          <p className="text-sm text-gray-400">
            {materialLabel(material)}, {quote.sizeRaw}
          </p>
        </div>
      ),
      duration: 5000,
      action: (
        <Link
          href="/cart"
          className="bg-white text-black px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100"
        >
          View Cart
        </Link>
      ),
    });
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-6">
      <p className="text-xs text-gray-400 leading-relaxed border border-gray-700 rounded-md p-3">
        List prices use <span className="text-gray-300">{referenceLabel}</span>{" "}
        ({PDP_REFERENCE_COUNTRY}) as the reference market. Delivery/postal for
        your order is calculated at checkout from your shipping country.
      </p>

      <div>
        <label className="block text-sm font-medium mb-3 text-gray-300">
          Material / finish
        </label>
        <Select value={material} onValueChange={setMaterial}>
          <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
            <SelectValue placeholder="Select material" />
          </SelectTrigger>
          <SelectContent>
            {mats.map((m) => (
              <SelectItem key={m} value={m}>
                {materialLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3 text-gray-300">
          Size
        </label>
        <Select value={sizeKey} onValueChange={setSizeKey}>
          <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            {sizeOptions.map((s) => (
              <SelectItem key={s.sizeKey} value={s.sizeKey}>
                {s.sizeRaw}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3 text-gray-300">
          Quantity
        </label>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="bg-gray-800 border-gray-600 hover:bg-gray-700"
          >
            -
          </Button>
          <input
            type="number"
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
            }
            className="w-16 text-center bg-gray-800 border border-gray-600 rounded-lg p-2 text-white"
            min={1}
          />
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="bg-gray-800 border-gray-600 hover:bg-gray-700"
          >
            +
          </Button>
        </div>
      </div>

      {quote && (
        <div className="border-t border-gray-700 pt-4 space-y-2 text-sm">
          {!quote.available ? (
            <p className="text-amber-400">
              Not available for {referenceLabel} in this catalogue (see
              Important information).
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-2">
                Shown amounts are{" "}
                <span className="text-gray-300">per poster</span>. More copies
                multiply list print price; delivery is added per line at
                checkout for your destination.
              </p>
              <div className="flex justify-between text-gray-300">
                <span>Poster print ({referenceLabel})</span>
                <span>€{Number(quote.priceExShipping).toFixed(2)} / each</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 pt-1">
                <span>Delivery</span>
                <span>Added at checkout from your address</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-white pt-2 border-t border-gray-800">
                <span>This line × {quantity} (print only)</span>
                <span>
                  €{Number(quote.priceExShipping * quantity).toFixed(2)}
                </span>
              </div>
              {(quote.discountPercent || quote.marginLabel) && (
                <p className="text-xs text-gray-500 pt-1">
                  Studio reference: wholesale discount {quote.discountPercent || ""}{" "}
                  · margin indicator {quote.marginLabel || ""}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <Button
        type="button"
        onClick={addToCart}
        disabled={!quote?.available}
        className="w-full bg-white text-black hover:bg-gray-100 font-medium py-3 text-lg"
      >
        Add to Cart
      </Button>
    </div>
  );
}
