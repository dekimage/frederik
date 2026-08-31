"use client";
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import MobxStore from "@/mobx";
import Link from "next/link";
import { materialLabel, getCountryLabel, PDP_REFERENCE_COUNTRY } from "@/lib/pricingCatalog";
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
  const refLabel = getCountryLabel(PDP_REFERENCE_COUNTRY);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 mt-32">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8 text-center">
          Shopping Cart
        </h1>

        {cartProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">🛒</div>
            <p className="text-xl mb-6 text-gray-300">
              Your cart is currently empty.
            </p>
            <Link href="/shop">
              <button className="bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Continue Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="hidden md:block bg-gray-900 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-300">
                      Product
                    </th>
                    <th className="px-6 py-4 font-medium text-gray-300">
                      Size
                    </th>
                    <th className="px-6 py-4 font-medium text-gray-300">
                      Material
                    </th>
                    <th className="px-4 py-4 font-medium text-gray-300 text-right">
                      Print ea. ({refLabel})
                    </th>
                    <th className="px-4 py-4 font-medium text-gray-300">
                      Qty
                    </th>
                    <th className="px-4 py-4 font-medium text-gray-300 text-right">
                      Line total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cartProducts.map((item) => {
                    const linePrint = Number(item.price) * item.quantity;
                    return (
                      <tr
                        key={`${item.productId}-${item.sizeKey}-${item.material}`}
                        className="border-b border-gray-700 hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <button
                              className="text-red-500 hover:text-red-400 text-xl font-bold"
                              onClick={() =>
                                removeFromCart(
                                  item.productId,
                                  item.sizeKey,
                                  item.material
                                )
                              }
                            >
                              ×
                            </button>
                            <img
                              src={cloudinaryMaxQualityDeliveryUrl(item.image)}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-400">
                                {materialLabel(item.material)} · {item.size}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{item.size}</td>
                        <td className="px-6 py-4 text-gray-300">
                          {materialLabel(item.material)}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-300 text-sm tabular-nums">
                          €{Number(item.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
                              onClick={() =>
                                handleQuantityChange(
                                  item.productId,
                                  item.sizeKey,
                                  item.material,
                                  clampLineQuantity(item.quantity - 1)
                                )
                              }
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              min="1"
                              max={MAX_LINE_QUANTITY}
                              className="w-12 text-center bg-gray-800 border border-gray-600 rounded py-1"
                              onChange={(e) => {
                                handleQuantityChange(
                                  item.productId,
                                  item.sizeKey,
                                  item.material,
                                  clampLineQuantity(e.target.value)
                                );
                              }}
                            />
                            <button
                              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
                              onClick={() =>
                                handleQuantityChange(
                                  item.productId,
                                  item.sizeKey,
                                  item.material,
                                  clampLineQuantity(item.quantity + 1)
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right align-top tabular-nums font-medium text-white">
                          €{linePrint.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-md bg-gray-900 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2">Cart subtotal</h3>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  {t("shippingCoverageCart")}
                </p>
                <div className="space-y-2 text-sm tabular-nums">
                  <div className="flex justify-between gap-4 text-gray-300">
                    <span className="text-left shrink">Poster print (Σ qty)</span>
                    <span className="font-medium">
                      €{printSubtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 mt-2">
                    <div className="flex justify-between gap-4 font-semibold text-white">
                      <span>Due at payment (preview)</span>
                      <span className="text-gray-400 font-normal text-sm">
                        After checkout address
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {t("shippingCoverageCartCheckout")}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Max {MAX_LINE_QUANTITY} per line · {MAX_ORDER_TOTAL_QUANTITY}{" "}
                  items per order
                </p>
                <div className="mt-6">
                  <Link href="/checkout">
                    <button className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                      Proceed to Checkout
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default CartPage;
