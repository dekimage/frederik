"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import ProductCard from "@/components/admin/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";
import AddProductDialog from "@/components/admin/AddProductDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "spring", label: "Spring" },
  { id: "summer", label: "Summer" },
  { id: "autumn", label: "Autumn" },
  { id: "winter", label: "Winter" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products");
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      product.description?.toLowerCase().includes(searchLower) ||
      product.name?.toLowerCase().includes(searchLower);

    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Products</h1>

          <div className="flex-1 flex items-center gap-4 max-w-2xl">
            {/* Search Input */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus:border-zinc-700"
              />
            </div>

            {/* Category Filter */}
            <div className="w-48">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onUpdate={fetchProducts}
              />
            ))}
          </div>
        )}

        <AddProductDialog
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={() => {
            setIsAddDialogOpen(false);
            fetchProducts();
          }}
        />
      </div>
    </AdminLayout>
  );
}
