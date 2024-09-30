"use client";
import { observer } from "mobx-react";
import MobxStore from "@/mobx";

const CartPage = observer(() => {
  const { cartItems, calculateSubtotal, calculateTotal, shippingCost } =
    MobxStore;

  // Handle quantity change
  const handleQuantityChange = (id, newQuantity) => {
    MobxStore.updateQuantity(id, newQuantity);
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    MobxStore.removeFromCart(id);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Cart</h1>

      {/* Empty Cart Message */}
      {cartItems.length === 0 ? (
        <div className="text-center">
          <p className="text-lg mb-4">Your cart is currently empty.</p>
          <button className="bg-white text-black py-2 px-4 rounded">
            Continue Shopping
          </button>
        </div>
      ) : (
        // Cart Table
        <div className="space-y-8">
          <div className="hidden md:block">
            <table className="w-full text-left table-auto">
              <thead>
                <tr>
                  <th className="border-b border-white py-2">Product</th>
                  <th className="border-b border-white py-2">Price</th>
                  <th className="border-b border-white py-2">Quantity</th>
                  <th className="border-b border-white py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id} className="border-b border-white">
                    {/* Product Column */}
                    <td className="py-4 flex items-center space-x-4">
                      <button
                        className="text-red-500"
                        onClick={() => removeFromCart(item.id)}
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
                        <p className="text-sm text-gray-400">
                          {item.variation}
                        </p>
                      </div>
                    </td>

                    {/* Price Column */}
                    <td className="py-4">€{item.price}</td>

                    {/* Quantity Column */}
                    <td className="py-4">
                      <div className="flex items-center">
                        <button
                          className="bg-gray-700 px-2"
                          onClick={() =>
                            handleQuantityChange(
                              item.id,
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
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Subtotal Column */}
                    <td className="py-4">€{item.price * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Responsive Cart Items for Mobile */}
          <div className="md:hidden space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="border-b border-white py-4">
                {/* Product Details */}
                <div className="flex items-center space-x-4 mb-4">
                  <button
                    className="text-red-500"
                    onClick={() => removeFromCart(item.id)}
                  >
                    ×
                  </button>
                  <img src={item.image} alt={item.name} className="w-16 h-16" />
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm text-gray-400">{item.variation}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <span className="font-bold">Price: </span>€{item.price}
                </div>

                {/* Quantity */}
                <div className="mb-2 flex items-center">
                  <span className="font-bold">Quantity: </span>
                  <button
                    className="bg-gray-700 px-2 mx-2"
                    onClick={() =>
                      handleQuantityChange(
                        item.id,
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
                    className="w-12 text-center bg-gray-800"
                  />
                  <button
                    className="bg-gray-700 px-2 mx-2"
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <div>
                  <span className="font-bold">Subtotal: </span>€
                  {item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Table */}
          <div className="w-full max-w-md ml-auto">
            <table className="w-full text-left">
              <tbody>
                <tr className="border-b border-white">
                  <td className="py-2">Subtotal:</td>
                  <td className="py-2 text-right">€{calculateSubtotal()}</td>
                </tr>
                <tr className="border-b border-white">
                  <td className="py-2">Shipping:</td>
                  <td className="py-2 text-right">€{shippingCost}</td>
                </tr>
                <tr className="border-b border-white">
                  <td className="py-2 font-bold">Total:</td>
                  <td className="py-2 text-right font-bold">
                    €{calculateTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Checkout Button */}
          <div className="text-right">
            <button className="bg-white text-black py-2 px-6 rounded">
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default CartPage;
