"use client";

import { useEffect, useState } from "react";
import MobxStore from "@/mobx";
import ProductCard from "@/components/ProductCard"; // Make sure to import ProductCard
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import springImage from "../../../../assets/spring.png";
import summerImage from "../../../../assets/summer.png";
import autumnImage from "../../../../assets/autumn.png";
import winterImage from "../../../../assets/winter.png";

const getImageByCategory = (category) => {
  switch (category.toLowerCase()) {
    case "spring":
      return springImage;
    case "summer":
      return summerImage;
    case "autumn":
      return autumnImage;
    case "winter":
      return winterImage;
    default:
      return springImage;
  }
};

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

  // Define all categories
  const allCategories = [
    { id: "spring", name: "Spring" },
    { id: "summer", name: "Summer" },
    { id: "autumn", name: "Autumn" },
    { id: "winter", name: "Winter" },
  ];

  // Filter out current category to show other collections
  const otherCollections = allCategories.filter(
    (cat) => cat.id !== category.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-black text-white p-8 mt-32">
      <Link href={`/shop`} className="flex items-center mb-8">
        <ChevronLeft size={32} /> BACK
      </Link>
      <h1 className="text-4xl font-bold mb-8 text-center">
        {category.charAt(0).toUpperCase() + category.slice(1)} Collection
      </h1>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Other Collections Section */}
      <div className="mt-16 border-t border-gray-700 pt-12">
        <h2 className="text-3xl font-bold text-center mb-8">
          Explore Other Collections
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {otherCollections.map((collection) => (
            <Link
              key={collection.id}
              href={`/shop/${collection.id}`}
              className="group"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={getImageByCategory(collection.name)}
                  alt={collection.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <h3 className="text-2xl font-bold text-white">
                    {collection.name} Collection
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
