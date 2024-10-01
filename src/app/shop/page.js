"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import { categories } from "../page";
import MobxStore from "@/mobx";

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const productsList = await MobxStore.fetchLimitedProducts();
      setProducts(productsList);
    };

    const fetchBestSellers = async () => {
      const bestSellerList = await MobxStore.fetchBestSellers();
      setBestSellers(bestSellerList);
    };

    fetchProducts();
    fetchBestSellers();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8 mt-16">
      <h1 className="text-4xl font-bold mb-8 text-center">Shop</h1>

      {/* Shop by Category Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Shop by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {categories.map((category) => (
            <Link key={category.id} href={`/shop/${category.id}`}>
              <div className="border border-gray-500 p-4 rounded-lg text-center">
                <h3 className="text-2xl font-bold">{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Best Sellers Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-center">Best Sellers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {bestSellers.map((product) => (
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

      {/* All Products Section with View All Button */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-center">All Products</h2>
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

        <div className="text-center mt-8">
          <Link href="/shop/all">
            <button className="bg-white text-black py-2 px-6 rounded">
              View All Products
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
