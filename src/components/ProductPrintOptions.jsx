"use client";

import styles from "./product-detail.module.css";
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
import {
  clampLineQuantity,
  MAX_LINE_QUANTITY,
  MAX_ORDER_TOTAL_QUANTITY,
} from "@/lib/cartLimits";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ProductPrintOptions({ productId, product }) {
  const { toast } = useToast();
  const { t } = useLanguage();
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

    const result = MobxStore.addToCart({
      productId,
      quantity,
      sizeKey: quote.sizeKey,
      sizeRaw: quote.sizeRaw,
      material,
      price: quote.priceExShipping,
    });

    if (result?.ok === false) {
      toast({
        title: "Order limit reached",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
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
    <div className={styles.options}>
      <p className={styles.notice}>
        List prices use <span className="text-gray-300">{referenceLabel}</span>{" "}
        ({PDP_REFERENCE_COUNTRY}) as the reference market. {t("shippingCoveragePdp")}
      </p>

      <div>
        <label htmlFor="print-material">
          Material / finish
        </label>
        <Select value={material} onValueChange={setMaterial}>
          <SelectTrigger id="print-material" className={styles.select}>
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
        <label htmlFor="print-size">
          Size
        </label>
        <Select value={sizeKey} onValueChange={setSizeKey}>
          <SelectTrigger id="print-size" className={styles.select}>
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
        <label htmlFor="print-quantity">
          Quantity
        </label>
        <div className={styles.quantity}>
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
            id="print-quantity"
            type="number"
            value={quantity}
            onChange={(e) =>
              setQuantity(clampLineQuantity(e.target.value))
            }
            min={1}
            max={MAX_LINE_QUANTITY}
          />
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() =>
              setQuantity((q) => clampLineQuantity(q + 1))
            }
            className="bg-gray-800 border-gray-600 hover:bg-gray-700"
          >
            +
          </Button>
        </div>
        <p className={styles.limit}>
          Max {MAX_LINE_QUANTITY} per line · {MAX_ORDER_TOTAL_QUANTITY} items
          per order
        </p>
      </div>

      {quote && (
        <div className={styles.quote}>
          {!quote.available ? (
            <p className="text-amber-400">
              Not available for {referenceLabel} in this catalogue (see
              Important information).
            </p>
          ) : (
            <>
              <p className={styles.priceNote}>
                {t("pdpPrintPriceNote")}
              </p>
              <div className={styles.priceRow}>
                <span>Poster print ({referenceLabel})</span>
                <span>€{Number(quote.priceExShipping).toFixed(2)} / each</span>
              </div>
              <div className={styles.delivery}>
                <span>Delivery</span>
                <span>Added at checkout from your address</span>
              </div>
              <div className={styles.total}>
                <span>This line × {quantity} (print only)</span>
                <span>
                  €{Number(quote.priceExShipping * quantity).toFixed(2)}
                </span>
              </div>
              {(quote.discountPercent || quote.marginLabel) && (
                <p className={styles.studio}>
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
        className={styles.addToCart}
      >
        Add to Cart
      </Button>
    </div>
  );
}
