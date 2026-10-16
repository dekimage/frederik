"use client";

import styles from "@/components/product-detail.module.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MobxStore from "@/mobx";
import { observer } from "mobx-react-lite";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChevronLeft,
  ShoppingCart,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import RemotePhotoImage from "@/components/RemotePhotoImage";
import ProductPrintOptions from "@/components/ProductPrintOptions";

const ProductDetailsPage = observer(({ params }) => {
  const { product_id } = params;
  const [product, setProduct] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const fetchProduct = async () => {
      const productData = await MobxStore.getProductById(product_id);
      if (productData) {
        setProduct(productData);
      }
    };
    fetchProduct();
  }, [product_id]);

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button
          onClick={() => router.back()}
          className={styles.back}
        >
          <ChevronLeft size={24} className="mr-2" />
          <span className="text-lg">Back</span>
        </button>
        <div className={styles.layout}>
          <div className={styles.gallery}>
            <div className={styles.imageFrame}>
              <button type="button" className={styles.imageButton} onClick={() => setIsFullScreen(true)}>
              <RemotePhotoImage
                src={product.image}
                alt={product.name}
                width={500}
                height={500}
                className="hover:opacity-90 transition-opacity"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              </button>
              <p>
                Click to enlarge
              </p>
            </div>
          </div>
          <div className={styles.details}>
            <div>
              <h1>{product.name}</h1>
            </div>

            <ProductPrintOptions productId={product_id} product={product} />

            <Link
              href="/cart"
              className={styles.cartLink}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              View Shopping Cart
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Product Description - Full Width Section */}
        <div className={styles.description}>
          <h2>Product Description</h2>
          <p>
            {product.description}
          </p>
        </div>
      </div>

      {isFullScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div
            className="absolute inset-0"
            onClick={() => setIsFullScreen(false)}
          />
          <div className="relative z-10 w-[90vw] h-[90vh]">
            <div className="absolute inset-0">
              <RemotePhotoImage
                src={product.image}
                alt={product.name}
                fill
                className="object-contain"
                sizes="90vw"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>
            <div className="absolute top-4 right-4 flex space-x-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.1))}
                className="text-white hover:bg-white/20"
              >
                <ZoomOut className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.1))}
                className="text-white hover:bg-white/20"
              >
                <ZoomIn className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullScreen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
});

export default ProductDetailsPage;
