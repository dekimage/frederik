"use client";
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import MobxStore from "@/mobx";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKeyhole, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { formatCurrencyEUR } from "@/lib/orderUtils";
import shared from "@/app/checkout/checkout.module.css";
import styles from "./cart.module.css";
import { materialLabel } from "@/lib/pricingCatalog";
import { clampLineQuantity, MAX_LINE_QUANTITY, MAX_ORDER_TOTAL_QUANTITY } from "@/lib/cartLimits";
import { cloudinaryMaxQualityDeliveryUrl } from "@/lib/cloudinaryDeliveryUrl";
import { useLanguage } from "@/contexts/LanguageContext";

const CartPage = observer(() => {
  const [cartProducts, setCartProducts] = useState([]);
  const { t } = useLanguage();

  const fetchCartProducts = async () => {
    const products = await MobxStore.getCartProducts();
    setCartProducts(products);
  };

  useEffect(() => {
    fetchCartProducts();
  }, []);

  const handleQuantityChange = async (
    productId,
    sizeKey,
    material,
    newQuantity
  ) => {
    MobxStore.updateQuantity(productId, sizeKey, material, newQuantity);
    const updatedProducts = await MobxStore.getCartProducts();
    setCartProducts(updatedProducts);
  };

  const removeFromCart = async (productId, sizeKey, material) => {
    MobxStore.removeFromCart(productId, sizeKey, material);
    await fetchCartProducts();
  };

  const printSubtotal = cartProducts.reduce(
    (acc, item) => acc + Number(item.price) * item.quantity,
    0
  );
  const itemCount = cartProducts.reduce((count, item) => count + item.quantity, 0);

  return (
    <main className={styles.cart}>
      <div className={shared.container}>
        <Link href="/shop" className={shared.backLink}>
          <ArrowLeft size={16} aria-hidden="true" /> Continue shopping
        </Link>
        <div className={shared.heading}>
          <h1>Your cart <span className={styles.count}>{itemCount}</span></h1>
          <span className={shared.secure}><LockKeyhole size={15} aria-hidden="true" /> Secure payment with Stripe</span>
        </div>
        <p className={styles.intro}>Review your prints, then add your delivery details at checkout.</p>

        {cartProducts.length === 0 ? (
          <section className={styles.empty}>
            <span className={styles.emptyIcon}><ShoppingBag size={30} aria-hidden="true" /></span>
            <h2>Your cart is empty</h2>
            <p>Find a photograph you love and choose a print for your space.</p>
            <Link href="/shop" className={shared.primaryAction}>Explore prints <ArrowRight size={18} aria-hidden="true" /></Link>
          </section>
        ) : (
          <div className={styles.layout}>
            <section aria-labelledby="cart-items-heading" className={styles.items}>
              <div className={styles.sectionHeading}>
                <h2 id="cart-items-heading">Your prints</h2>
                <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
              </div>
              <ul className={styles.itemList}>
                {cartProducts.map((item) => {
                  const linePrint = Number(item.price) * item.quantity;
                  const itemLabel = `${item.name}, ${materialLabel(item.material)}, ${item.size}`;
                  return (
                    <li key={`${item.productId}-${item.sizeKey}-${item.material}`} className={styles.item}>
                      <div className={styles.imageFrame}>
                        {/* Keep the existing image delivery URL and native image behavior. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cloudinaryMaxQualityDeliveryUrl(item.image)} alt={item.name} className={styles.image} />
                      </div>
                      <div className={styles.product}>
                        <h3>{item.name}</h3>
                        <p>{materialLabel(item.material)}</p>
                        <p className={styles.size}>{item.size}</p>
                        <span className={styles.unitPrice}>{formatCurrencyEUR(Number(item.price))} each</span>
                      </div>
                      <div className={styles.lineTotal}>
                        <span>Line total</span>
                        <strong>{formatCurrencyEUR(linePrint)}</strong>
                      </div>
                      <div className={styles.itemControls}>
                        <div className={styles.quantityBlock}>
                          <span aria-hidden="true">Quantity</span>
                          <div className={styles.quantity}>
                            <button type="button" aria-label={`Decrease quantity for ${itemLabel}`}
                              onClick={() => item.quantity <= 1
                                ? removeFromCart(item.productId, item.sizeKey, item.material)
                                : handleQuantityChange(item.productId, item.sizeKey, item.material, item.quantity - 1)}>
                              <Minus size={16} aria-hidden="true" />
                            </button>
                            <input type="number" aria-label={`Quantity for ${itemLabel}`} value={item.quantity} min="1" max={MAX_LINE_QUANTITY}
                              onChange={(e) => handleQuantityChange(item.productId, item.sizeKey, item.material, clampLineQuantity(e.target.value))} />
                            <button type="button" aria-label={`Increase quantity for ${itemLabel}`} disabled={item.quantity >= MAX_LINE_QUANTITY || itemCount >= MAX_ORDER_TOTAL_QUANTITY}
                              onClick={() => handleQuantityChange(item.productId, item.sizeKey, item.material, clampLineQuantity(item.quantity + 1))}>
                              <Plus size={16} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        <button type="button" className={styles.remove} aria-label={`Remove ${itemLabel} from cart`}
                          onClick={() => removeFromCart(item.productId, item.sizeKey, item.material)}>
                          <Trash2 size={15} aria-hidden="true" /> Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className={styles.limit}>Up to {MAX_LINE_QUANTITY} per print · {MAX_ORDER_TOTAL_QUANTITY} items per order</p>
            </section>

            <aside className={styles.sidebar} aria-label="Cart summary">
              <div className={styles.summary}>
                <h2>Order summary</h2>
                <div className={styles.summaryRow}><span>Prints ({itemCount})</span><span>{formatCurrencyEUR(printSubtotal)}</span></div>
                <div className={styles.summaryRow}><span>Delivery</span><span className={styles.deliveryEstimate}>Calculated at checkout</span></div>
                <div className={styles.subtotal} aria-live="polite" aria-atomic="true"><span>Print subtotal</span><strong>{formatCurrencyEUR(printSubtotal)}</strong></div>
                <p className={styles.totalNote}>Delivery is added after you select your shipping country.</p>
                <div className={styles.nextStep}>
                  <Link href="/checkout" className={shared.primaryAction}>Continue to checkout <ArrowRight size={18} aria-hidden="true" /></Link>
                  <p>Next: add your delivery details and review the final total.</p>
                  <span className={styles.secureNote}><LockKeyhole size={13} aria-hidden="true" /> Payment comes after your address details</span>
                </div>
              </div>
              <details className={styles.deliveryInfo}>
                <summary><Truck size={18} aria-hidden="true" /> Delivery & pricing information</summary>
                <p>{t("shippingCoverageCart")}</p>
                <p>{t("shippingCoverageCartCheckout")}</p>
              </details>
            </aside>
          </div>
        )}
        {cartProducts.length > 0 && (
          <div className={styles.mobileAction}>
            <div><span>Print subtotal <strong>{formatCurrencyEUR(printSubtotal)}</strong></span><small>Delivery calculated at checkout</small></div>
            <Link href="/checkout" className={shared.primaryAction}>Continue to checkout <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        )}
      </div>
    </main>
  );
});

export default CartPage;
