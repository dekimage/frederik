"use client";

import { useEffect, useState } from "react";
import MobxStore from "@/mobx";
import ProductCard from "@/components/ProductCard"; // Make sure to import ProductCard
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

const CategoryPage = ({ params }) => {
  const { category } = params;
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      const productsList = await MobxStore.fetchProductsByCategory(category);
      setProducts(productsList);
    };

    fetchCategoryProducts();
  }, [category]);

  return (
    <div className="min-h-screen bg-black text-white p-8 mt-24">
      <Link href={`/shop`} className="flex items-center mb-8">
        <ChevronLeft size={32} /> BACK
      </Link>
      <h1 className="text-4xl font-bold mb-8 text-center">
        {category.charAt(0).toUpperCase() + category.slice(1)} Collection
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default CategoryPage;
