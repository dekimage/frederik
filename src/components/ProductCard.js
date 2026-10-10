"use client";

import Link from "next/link";
import RemotePhotoImage from "@/components/RemotePhotoImage";
import { useLanguage } from "@/contexts/LanguageContext";

const ProductCard = ({ product }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-black border border-gray-800 rounded-lg overflow-hidden transition-all duration-300 hover:border-gray-600">
      <Link href={`/product-details/${product.id}`} className="block">
        <div className="relative w-full aspect-square">
          <RemotePhotoImage
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-all duration-300 hover:opacity-80"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-2 text-white truncate">
            {product.name}
          </h2>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {product.description}
          </p>
          <span className="block text-sm text-gray-400 text-right">
            {t("shopViewDetails")}
          </span>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
