"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";
import ImageCard from "@/components/admin/ImageCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";
import AddImageDialog from "@/components/admin/AddImageDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Docs like `hero`, `about`, `home` usually have no seasonal `category` — they aren't gallery rows. */
function imageCategoryBucket(image) {
  const c = typeof image.category === "string" ? image.category.trim() : "";
  return c || "site-slot";
}

export default function ImagesPage() {
  const [images, setImages] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchImages();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await adminFetch("/api/admin/categories");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load categories.");
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching image categories:", error);
    }
  };

  const categoryFilters = [
    { id: "all", label: "All" },
    { id: "site-slot", label: "Site slots (hero, about, …)" },
    ...categories
      .filter((category) => category.id !== "site-slot")
      .map((category) => ({ id: category.id, label: category.name })),
  ];

  const fetchImages = async () => {
    setError("");
    try {
      const response = await adminFetch("/api/admin/images");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load images.");
      setImages(data.images || []);
    } catch (error) {
      console.error("Error fetching images:", error);
      setError(error.message || "Unable to load images.");
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter((image) => {
    const searchLower = searchQuery.trim().toLowerCase();
    const haystack =
      `${image.description ?? ""} ${image.name ?? ""} ${image.id ?? ""}`.toLowerCase();
    const matchesSearch = searchLower === "" || haystack.includes(searchLower);

    const matchesCategory =
      selectedCategory === "all"
        ? true
        : imageCategoryBucket(image) === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Images</h1>

          <div className="flex-1 flex items-center gap-4 max-w-2xl">
            {/* Search Input */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search images..."
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
          </div>

          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Image
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
            {filteredImages.map((image) => (
              <ImageCard key={image.id} image={image} onUpdate={fetchImages} />
            ))}
          </div>
        )}

        <AddImageDialog
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={() => {
            setIsAddDialogOpen(false);
            fetchImages();
          }}
        />
    </div>
  );
}
