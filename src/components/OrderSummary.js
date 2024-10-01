const OrderSummary = ({ cartItems, subtotal, shippingCost, taxRate }) => {
  const calculateTax = () => (subtotal * taxRate).toFixed(2);
  const calculateTotal = () =>
    (subtotal + shippingCost + parseFloat(calculateTax())).toFixed(2);

  return (
    <div className="bg-gray-800 p-6 rounded-lg text-white">
      <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
      <div className="space-y-4">
        {cartItems.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>
              {item.name} x {item.quantity}
            </span>
            <span>€{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-gray-600 my-4"></div>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>€{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>€{shippingCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>€{calculateTax()}</span>
        </div>
        <div className="border-t border-gray-600 my-4"></div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>€{calculateTotal()}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
