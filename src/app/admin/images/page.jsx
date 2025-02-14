"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
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

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "spring", label: "Spring" },
  { id: "summer", label: "Summer" },
  { id: "autumn", label: "Autumn" },
  { id: "winter", label: "Winter" },
];

export default function ImagesPage() {
  const [images, setImages] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch("/api/admin/images");
      const data = await response.json();
      setImages(data.images);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter((image) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      image.description?.toLowerCase().includes(searchLower) ||
      image.name?.toLowerCase().includes(searchLower);

    const matchesCategory =
      selectedCategory === "all" || image.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout>
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
            Add Image
          </Button>
        </div>

        {loading ? (
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
    </AdminLayout>
  );
}
