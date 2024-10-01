"use client";

import { useEffect, useState } from "react";
import MobxStore from "@/mobx";

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
    <div className="min-h-screen bg-black text-white p-8 mt-16">
      <h1 className="text-4xl font-bold mb-8 text-center">
        {category.charAt(0).toUpperCase() + category.slice(1)} Collection
      </h1>

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
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPage;
