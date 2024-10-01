"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

const ShopPage = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const productsSnapshot = await getDocs(collection(db, "products"));
      const productsList = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsList);
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8 mt-16">
      <h1 className="text-4xl font-bold mb-8 text-center">Shop</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="border border-gray-500 p-4 rounded-lg"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover mb-4"
            />
            <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
            <p className="text-lg mb-4">€{product.price}</p>
            <Link href={`/product-details/${product.id}`}>
              <button className="bg-white text-black py-2 px-4 rounded">
                View Details
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopPage;
