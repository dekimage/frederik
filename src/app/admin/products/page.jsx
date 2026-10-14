"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";
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

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [publicationStatus, setPublicationStatus] = useState("all");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await adminFetch("/api/admin/categories");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load categories.");
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching product categories:", error);
    }
  };

  const categoryFilters = [
    { id: "all", label: "All" },
    ...categories.map((category) => ({ id: category.id, label: category.name })),
  ];

  const fetchProducts = async () => {
    setError("");
    try {
      const response = await adminFetch("/api/admin/products");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load products.");
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(error.message || "Unable to load products.");
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
    const matchesPublication =
      publicationStatus === "all" ||
      (publicationStatus === "published"
        ? product.published !== false
        : product.published === false);

    return matchesSearch && matchesCategory && matchesPublication;
  });

  return (
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
              />
            </div>

            {/* Category Filter */}
            <div className="w-48">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryFilters.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <Select
                value={publicationStatus}
                onValueChange={setPublicationStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Publication" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : loading ? (
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
  );
}
