"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import MobxStore from "@/mobx";
import { useLanguage } from "@/contexts/LanguageContext";
import { categoryLabel } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import { CategoriesSection } from "@/app/page";
import styles from "@/components/storefront.module.css";

const CategoryPage = observer(() => {
  const { category } = useParams();
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    MobxStore.fetchProductsByCategory(category)
      .then((rows) => {
        if (active) setProducts(rows);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category]);
  const entry = MobxStore.categories.find(
    (item) =>
      item.id === category ||
      item.name.toLowerCase() === category.toLowerCase(),
  );
  return (
    <main className={styles.page}>
      <Link href="/shop" className={styles.back}>
        {t("Back")}
      </Link>
      <h1 className={styles.sectionTitle}>
        {categoryLabel(entry || { name: category }, t)} {t("Collection")}
      </h1>
      {loading ? (
        <p role="status">{t("Loading...")}</p>
      ) : products.length ? (
        <div className={styles.productGrid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p>{t("No products found")}</p>
      )}
      <h2 className={styles.sectionTitle}>{t("Explore Other Collections")}</h2>
      <CategoriesSection
        isFromShop
        categories={MobxStore.categories.filter(
          (item) => item.id !== entry?.id,
        )}
      />
    </main>
  );
});
export default CategoryPage;
