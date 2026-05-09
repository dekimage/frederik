"use client";

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
    <div className="min-h-screen bg-black text-white p-8 mt-24">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center my-8 text-gray-300 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} className="mr-2" />
          <span className="text-lg">Back</span>
        </button>
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/2">
            <div className="bg-gray-900 rounded-lg p-4">
              <RemotePhotoImage
                src={product.image}
                alt={product.name}
                width={500}
                height={500}
                className="w-full h-auto object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                sizes="(max-width: 1024px) 100vw, 50vw"
                onClick={() => setIsFullScreen(true)}
              />
              <p className="text-sm text-gray-400 mt-2 text-center">
                Click to enlarge
              </p>
            </div>
          </div>
          <div className="lg:w-1/2 space-y-6">
            <div>
              <h1 className="text-3xl font-semibold mb-4">{product.name}</h1>
            </div>

            <ProductPrintOptions productId={product_id} product={product} />

            <Link
              href="/cart"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              View Shopping Cart
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Product Description - Full Width Section */}
        <div className="mt-16 bg-gray-900 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">Product Description</h2>
          <p className="text-lg text-gray-300 leading-relaxed">
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

      <div className="fixed bottom-8 right-8">
        <Link href="/cart">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-16 h-16"
          >
            <ShoppingCart className="h-6 w-6 text-black" />
          </Button>
        </Link>
      </div>
    </div>
  );
});

export default ProductDetailsPage;
