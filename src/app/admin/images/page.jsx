"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import ImageCard from "@/components/admin/ImageCard";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import AddImageDialog from "@/components/admin/AddImageDialog";

export default function ImagesPage() {
  const [images, setImages] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Images</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Image
          </Button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
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
