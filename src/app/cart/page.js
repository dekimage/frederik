"use client";
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import MobxStore from "@/mobx";
import Link from "next/link";
import { toJS } from "mobx";

const CartPage = observer(() => {
  const [cartProducts, setCartProducts] = useState([]);

  useEffect(() => {
    // Fetch cart products and set them to the state
    const fetchCartProducts = async () => {
      const products = await MobxStore.getCartProducts();
      setCartProducts(products);
    };

    fetchCartProducts();
  }, []);

  const handleQuantityChange = async (productId, size, newQuantity) => {
    // Update quantity in MobX store
    MobxStore.updateQuantity(productId, size, newQuantity);

    // Re-fetch the cart products from the store to update local state
    const updatedProducts = await MobxStore.getCartProducts();
    setCartProducts(updatedProducts); // Update the local state
  };

  // Remove item from cart
  const removeFromCart = (productId, size) => {
    MobxStore.removeFromCart(productId, size);
  };

  const total = MobxStore.calculateTotal();
  console.log("Total before toFixed:", total); // Debugging line

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Cart</h1>

      {/* Empty Cart Message */}
      {cartProducts.length === 0 ? (
        <div className="text-center">
          <p className="text-lg mb-4">Your cart is currently empty.</p>
          <Link href="/shop">
            <button className="bg-white text-black py-2 px-4 rounded">
              Continue Shopping
            </button>
          </Link>
        </div>
      ) : (
        // Cart Table
        <div className="space-y-8">
          <div className="hidden md:block">
            <table className="w-full text-left table-auto">
              <thead>
                <tr>
                  <th className="border-b border-white py-2">Product</th>
                  <th className="border-b border-white py-2">Size</th>
                  <th className="border-b border-white py-2">Price</th>
                  <th className="border-b border-white py-2">Quantity</th>
                  <th className="border-b border-white py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cartProducts.map((item) => (
                  <tr
                    key={`${item.productId}-${item.size}`}
                    className="border-b border-white"
                  >
                    {/* Product Column */}
                    <td className="py-4 flex items-center space-x-4">
                      <button
                        className="text-red-500"
                        onClick={() =>
                          removeFromCart(item.productId, item.size)
                        }
                      >
                        ×
                      </button>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16"
                      />
                      <div>
                        <p>{item.name}</p>
                      </div>
                    </td>

                    {/* Size Column */}
                    <td className="py-4">{item.size}</td>

                    {/* Price Column */}
                    <td className="py-4">€{item.price}</td>

                    {/* Quantity Column */}
                    <td className="py-4">
                      <div className="flex items-center">
                        <button
                          className="bg-gray-700 px-2"
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.size,
                              Math.max(1, item.quantity - 1)
                            )
                          }
                        >
                          -
                        </button>
                        <input
                          type="text"
                          readOnly
                          value={item.quantity}
                          className="w-12 text-center bg-gray-800 mx-2"
                        />
                        <button
                          className="bg-gray-700 px-2"
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.size,
                              item.quantity + 1
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Subtotal Column */}
                    <td className="py-4">
                      €{(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Table */}
          <div className="w-full max-w-md ml-auto">
            <table className="w-full text-left">
              <tbody>
                <tr className="border-b border-white">
                  <td className="py-2">Subtotal:</td>
                  <td className="py-2 text-right">
                    €{MobxStore.calculateSubtotal()?.toFixed(2)}
                  </td>
                </tr>
                <tr className="border-b border-white">
                  <td className="py-2">Shipping:</td>
                  <td className="py-2 text-right">
                    €{MobxStore.shopConfig?.shippingRate}
                  </td>
                </tr>
                <tr className="border-b border-white">
                  <td className="py-2 font-bold">Total:</td>
                  <td className="py-2 text-right font-bold">
                    €{(total || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Checkout Button */}
          <div className="text-right">
            <Link href="/checkout">
              <button className="bg-white text-black py-2 px-6 rounded">
                Proceed to Checkout
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
});

export default CartPage;
