"use client";

import styles from "./storefront.module.css";
import Link from "next/link";
import RemotePhotoImage from "@/components/RemotePhotoImage";
import { useLanguage } from "@/contexts/LanguageContext";

const ProductCard = ({ product }) => {
  const { t } = useLanguage();

  return (
    <div className={styles.productCard}>
      <Link href={`/product-details/${product.id}`} className={styles.productLink}>
        <div className={styles.productImage}>
          <RemotePhotoImage
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 479px) 100vw, (max-width: 767px) 50vw, (max-width: 1100px) 33vw, 25vw"
          />
        </div>
        <div className={styles.productBody}>
          <h2>
            {product.name}
          </h2>
          <p>
            {product.description}
          </p>
          <span>
            {t("shopViewDetails")}
          </span>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
