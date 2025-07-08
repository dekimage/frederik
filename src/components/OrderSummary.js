"use client";
const OrderSummary = ({ cartItems, subtotal, shippingCost, taxRate }) => {
  const calculateTax = () => (subtotal * taxRate).toFixed(2);
  const calculateTotal = () =>
    (subtotal + parseFloat(shippingCost) + parseFloat(calculateTax())).toFixed(
      2
    );

  return (
    <div
      className="bg-gray-900 p-6 rounded-lg text-white border border-gray-700"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>
      <div className="space-y-4">
        {cartItems.map((item) => (
          <div
            key={`${item.productId}-${item.size}`}
            className="flex justify-between py-2 text-gray-300"
          >
            <span>
              {item.name} ({item.size}) x {item.quantity}
            </span>
            <span className="font-medium">
              €{(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
        <div className="border-t border-gray-700 my-4"></div>
        <div className="flex justify-between py-2 text-gray-300">
          <span>Subtotal</span>
          <span>€{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-2 text-gray-300">
          <span>Shipping</span>
          <span>€{shippingCost}</span>
        </div>
        <div className="flex justify-between py-2 text-gray-300">
          <span>Tax</span>
          <span>€{calculateTax()}</span>
        </div>
        <div className="border-t border-gray-700 my-4"></div>
        <div className="flex justify-between text-xl font-semibold py-2">
          <span>Total</span>
          <span>€{calculateTotal()}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
