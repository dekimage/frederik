"use client";

import { useState, useEffect } from "react";
import MobxStore from "@/mobx"; // MobX store for cart operations

const ProductDetailsPage = ({ params }) => {
  const { product_id } = params;
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(""); // For size selection

  useEffect(() => {
    const fetchProduct = async () => {
      const productData = await MobxStore.getProductById(product_id);
      if (productData) {
        setProduct(productData);
        if (MobxStore.shopConfig?.sizes) {
          setSelectedSize(MobxStore.shopConfig.sizes[0]?.size || ""); // Set default size
        }
      }
    };
    fetchProduct();
  }, [product_id]);

  // Function to add the product with the selected size to the cart
  const addToCart = () => {
    if (product && selectedSize) {
      const selectedSizeObj = MobxStore.shopConfig.sizes.find(
        (sizeObj) => sizeObj.size === selectedSize
      );
      const price = selectedSizeObj ? parseFloat(selectedSizeObj.price) : 0;
      MobxStore.addToCart({
        productId: product_id,
        quantity,
        size: selectedSize,
        price,
      });
      alert(`${quantity} x ${product.name} (${selectedSize}) added to cart!`);
    }
  };

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-96 object-cover mb-8"
        />
        <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
        <p className="text-lg mb-8">{product.description}</p>

        {/* Size Selection */}
        <div className="mb-4">
          <label htmlFor="size" className="mr-4">
            Size:
          </label>
          <select
            id="size"
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="bg-gray-800 text-white p-2 rounded"
          >
            {MobxStore.shopConfig?.sizes.map((sizeObj) => (
              <option key={sizeObj.size} value={sizeObj.size}>
                {sizeObj.size} (€{sizeObj.price})
              </option>
            ))}
          </select>
        </div>

        {/* Quantity Selection */}
        <div className="flex items-center mb-4">
          <label htmlFor="quantity" className="mr-4">
            Quantity:
          </label>
          <button
            className="bg-gray-700 px-2"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            -
          </button>
          <input
            type="text"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-12 text-center bg-gray-800 mx-2"
          />
          <button
            className="bg-gray-700 px-2"
            onClick={() => setQuantity(quantity + 1)}
          >
            +
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={addToCart}
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
