"use client";
import { useLanguage as useStorefrontLanguage } from "@/contexts/LanguageContext";

import { useState, useEffect } from "react";
import Link from "next/link";

import MobxStore from "@/mobx";
import styles from "@/components/storefront.module.css";
import ProductCard from "@/components/ProductCard";
import { CategoriesSection } from "../page";
import { observer } from "mobx-react-lite";

const ShopPage = () => {
  const { t: tr } = useStorefrontLanguage();
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
      {/* <h1 className={styles.sectionTitle}>Shop</h1> */}

      {/* Replace the Shop by Category Section with CategoriesSection */}
      <CategoriesSection categories={MobxStore.categories} isFromShop={true} />

      <div className="max-w-[1360px] mx-auto">
        {/* Best Sellers Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{tr("Best Sellers")}</h2>
          <div className={`${styles.productGrid} ${styles.featuredGrid}`}>
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* All Products Section with View All Button */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{tr("All Products")}</h2>
          <div className={styles.productGrid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/shop/all" className={styles.viewAll}>
              {tr("View All Products")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(ShopPage);
