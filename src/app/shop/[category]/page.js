"use client";

import { useEffect, useState } from "react";
import MobxStore from "@/mobx";
import styles from "@/components/storefront.module.css";
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
    <div className={styles.page}>
      <Link href={`/shop`} className={styles.back}>
        <ChevronLeft size={32} /> BACK
      </Link>
      <h1 className={styles.sectionTitle}>
        {category.charAt(0).toUpperCase() + category.slice(1)} Collection
      </h1>

      {/* Products Grid */}
      <div className={styles.productGrid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Other Collections Section */}
      <div className={styles.otherCollections}>
        <h2 className={styles.sectionTitle}>
          Explore Other Collections
        </h2>
        <div className={styles.otherGrid}>
          {otherCollections.map((collection) => (
            <Link
              key={collection.id}
              href={`/shop/${collection.id}`}
              className={styles.categoryCard}
            >
              <div className={styles.categoryImage}>
                <Image
                  src={getImageByCategory(collection.name)}
                  alt={collection.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className={styles.categoryOverlay}>
                  <h3>
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
