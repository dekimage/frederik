"use client";
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import MobxStore from "@/mobx";
import Link from "next/link";
import { toJS } from "mobx";

const CartPage = observer(() => {
  const [cartProducts, setCartProducts] = useState([]);

  const fetchCartProducts = async () => {
    const products = await MobxStore.getCartProducts();
    setCartProducts(products);
  };

  useEffect(() => {
    fetchCartProducts();
  }, []);

  const handleQuantityChange = async (
    productId,
    size,
    material,
    newQuantity
  ) => {
    // Update quantity in MobX store
    MobxStore.updateQuantity(productId, size, material, newQuantity);

    // Re-fetch the cart products from the store to update local state
    const updatedProducts = await MobxStore.getCartProducts();
    setCartProducts(updatedProducts); // Update the local state
  };

  // Remove item from cart
  const removeFromCart = async (productId, size, material) => {
    MobxStore.removeFromCart(productId, size, material);
    // Refresh the cart products after removal
    await fetchCartProducts();
  };

  const total = MobxStore.calculateTotal();

  return (
    <div
      className="min-h-screen bg-black text-white p-4 md:p-8 mt-32"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8 text-center">
          Shopping Cart
        </h1>

        {/* Empty Cart Message */}
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
          // Cart Table
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
                    <th className="px-6 py-4 font-medium text-gray-300">
                      Price
                    </th>
                    <th className="px-6 py-4 font-medium text-gray-300">
                      Quantity
                    </th>
                    <th className="px-6 py-4 font-medium text-gray-300">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cartProducts.map((item) => (
                    <tr
                      key={`${item.productId}-${item.size}-${item.material}`}
                      className="border-b border-gray-700 hover:bg-gray-800 transition-colors"
                    >
                      {/* Product Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <button
                            className="text-red-500 hover:text-red-400 text-xl font-bold"
                            onClick={() =>
                              removeFromCart(
                                item.productId,
                                item.size,
                                item.material
                              )
                            }
                          >
                            ×
                          </button>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-400">
                              {item.size} - {item.material}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Size Column */}
                      <td className="px-6 py-4 text-gray-300">{item.size}</td>

                      {/* Material Column */}
                      <td className="px-6 py-4 text-gray-300">
                        {item.material}
                      </td>

                      {/* Price Column */}
                      <td className="px-6 py-4 font-medium">€{item.price}</td>

                      {/* Quantity Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
                            onClick={() =>
                              handleQuantityChange(
                                item.productId,
                                item.size,
                                item.material,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            min="1"
                            className="w-12 text-center bg-gray-800 border border-gray-600 rounded py-1"
                            onChange={(e) => {
                              const newQuantity = parseInt(e.target.value) || 1;
                              handleQuantityChange(
                                item.productId,
                                item.size,
                                item.material,
                                Math.max(1, newQuantity)
                              );
                            }}
                          />
                          <button
                            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
                            onClick={() =>
                              handleQuantityChange(
                                item.productId,
                                item.size,
                                item.material,
                                item.quantity + 1
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Subtotal Column */}
                      <td className="px-6 py-4 font-medium">
                        €{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Section */}
            <div className="flex justify-end">
              <div className="w-full max-w-md bg-gray-900 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal:</span>
                    <span>€{MobxStore.calculateSubtotal()?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Shipping:</span>
                    <span>€{MobxStore.shopConfig?.shippingRate}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>€{(total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
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
