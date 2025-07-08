"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MobxStore from "@/mobx";
import { observer } from "mobx-react-lite";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowRight,
  ChevronLeft,
  ShoppingCart,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const MATERIALS = [
  { id: "wooden", label: "Wooden" },
  { id: "glass", label: "Glass" },
  { id: "iron", label: "Iron" },
  { id: "marble", label: "Marble" },
  { id: "steel", label: "Steel" },
];

export const PRICE_COMBINATIONS = {
  "small-wooden": 29.99,
  "small-glass": 39.99,
  "small-iron": 49.99,
  "small-marble": 69.99,
  "small-steel": 59.99,
  "medium-wooden": 49.99,
  "medium-glass": 59.99,
  "medium-iron": 69.99,
  "medium-marble": 89.99,
  "medium-steel": 79.99,
  "large-wooden": 69.99,
  "large-glass": 79.99,
  "large-iron": 89.99,
  "large-marble": 109.99,
  "large-steel": 99.99,
  "xl-wooden": 89.99,
  "xl-glass": 99.99,
  "xl-iron": 109.99,
  "xl-marble": 129.99,
  "xl-steel": 119.99,
};

const ProductDetailsPage = observer(({ params }) => {
  const { product_id } = params;
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      const productData = await MobxStore.getProductById(product_id);
      if (productData) {
        setProduct(productData);
        if (MobxStore.shopConfig?.sizes) {
          setSelectedSize(MobxStore.shopConfig.sizes[0]?.size || "");
          setSelectedMaterial(MATERIALS[0]?.id || "");
        }
      }
    };
    fetchProduct();
  }, [product_id]);

  const getCurrentPrice = () => {
    const combination = `${selectedSize.toLowerCase()}-${selectedMaterial}`;
    return PRICE_COMBINATIONS[combination] || 0;
  };

  const addToCart = () => {
    if (product && selectedSize && selectedMaterial) {
      const price = getCurrentPrice();
      MobxStore.addToCart({
        productId: product_id,
        quantity,
        size: selectedSize,
        material: selectedMaterial,
        price,
      });
      toast({
        title: "Added to Cart",
        description: `${quantity} x ${product.name} (${selectedSize}, ${selectedMaterial}) added to your cart.`,
        duration: 3000,
      });
    }
  };

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
        <div
          onClick={() => router.back()}
          className="cursor-pointer flex items-center my-8"
        >
          <ChevronLeft size={32} /> BACK
        </div>
        <div className="flex flex-col md:flex-row gap-12">
          <div className="md:w-1/2">
            <Image
              src={product.image}
              alt={product.name}
              width={500}
              height={500}
              className="w-full h-auto object-cover rounded-lg shadow-lg cursor-pointer"
              onClick={() => setIsFullScreen(true)}
            />
          </div>
          <div className="md:w-1/2 space-y-6">
            <h1 className="text-4xl font-bold">{product.name}</h1>
            <p className="text-xl text-gray-400 ">{product.description}</p>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="size"
                  className="block text-sm font-medium mb-2"
                >
                  Size
                </label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a size" />
                  </SelectTrigger>
                  <SelectContent>
                    {MobxStore.shopConfig?.sizes.map((sizeObj) => (
                      <SelectItem key={sizeObj.size} value={sizeObj.size}>
                        {sizeObj.size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label
                  htmlFor="material"
                  className="block text-sm font-medium mb-2"
                >
                  Material
                </label>
                <Select
                  value={selectedMaterial}
                  onValueChange={setSelectedMaterial}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a material" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIALS.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSize && selectedMaterial && (
                <div className="mt-4">
                  <p className="text-2xl font-bold text-white">
                    Price: €{getCurrentPrice().toFixed(2)}
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium mb-2"
                >
                  Quantity
                </label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-16 text-center bg-gray-800 border border-gray-700 rounded p-2"
                    min="1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            <Button onClick={addToCart} className="w-full">
              Add to Cart
            </Button>

            <Link
              href="/cart"
              className="inline-flex items-center text-blue-500 hover:text-blue-400"
            >
              Go to Shopping Cart <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {isFullScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative w-[90vw] h-[90vh]">
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
            <Image
              src={product.image}
              alt={product.name}
              layout="fill"
              objectFit="contain"
              className="w-full h-full"
              style={{ transform: `scale(${zoomLevel})` }}
            />
          </div>
          <div
            className="absolute inset-0"
            onClick={() => setIsFullScreen(false)}
          ></div>
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
