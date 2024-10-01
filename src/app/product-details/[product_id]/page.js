"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import MobxStore from "@/mobx"; // MobX store for cart operations
import { db } from "@/firebase"; // Firebase config

const ProductDetailsPage = ({ params }) => {
  const { product_id } = params;
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProductDetails = async () => {
      const productRef = doc(db, "products", product_id);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        setProduct(productSnap.data());
      } else {
        console.error("Product not found");
      }
    };

    fetchProductDetails();
  }, [product_id]);

  // Function to add the product to the cart
  const addToCart = () => {
    if (product) {
      MobxStore.addToCart({
        productId: product_id,
        quantity,
      });
      alert(`${quantity} x ${product.name} added to cart!`);
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
        <p className="text-xl mb-4">€{product.price}</p>
        <p className="text-lg mb-8">{product.description}</p>

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
