"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MobxStore from "@/mobx";
import ProductCard from "@/components/ProductCard";
import { ChevronLeft } from "lucide-react";

const AllProductsPage = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchAllProducts = async () => {
      const allProductsList = await MobxStore.fetchAllProducts();
      setProducts(allProductsList);
    };

    fetchAllProducts();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8 mt-24">
      <Link href={`/shop`} className="flex items-center mb-8">
        <ChevronLeft size={32} /> BACK
      </Link>
      <h1 className="text-4xl font-bold mb-8 text-center">All Products</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default AllProductsPage;
