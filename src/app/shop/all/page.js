"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MobxStore from "@/mobx";
import styles from "@/components/storefront.module.css";
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
    <div className={styles.page}>
      <Link href={`/shop`} className={styles.back}>
        <ChevronLeft size={32} /> BACK
      </Link>
      <h1 className={styles.sectionTitle}>All Products</h1>

      <div className={styles.productGrid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default AllProductsPage;
