"use client";

import { useState } from "react";
import { adminFetch } from "@/lib/adminFetch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon } from "lucide-react";
import CategorySelect from "./CategorySelect";

export default function AddProductDialog({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", imageFile);
      formDataToSend.append("productData", JSON.stringify(formData));

      const response = await adminFetch("/api/admin/products", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create product");
      }

      onSuccess();
      handleReset();
    } catch (error) {
      console.error("Error creating product:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setPreview(null);
    setFormData({
      name: "",
      description: "",
      category: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {preview ? (
              <div className="aspect-video relative rounded-lg overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">Upload an image</div>
                </div>
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-2"
            />
          </div>

          <Input
            placeholder="Product name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <p className="text-xs text-muted-foreground leading-relaxed">
            Prices are set in the print catalogue (material × size × country),
            not per product. Customers choose options on the product page.
          </p>

          <Textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          />

          <div className="space-y-2">
            <span className="text-sm font-medium">Category</span>
            <CategorySelect
              value={formData.category}
              onValueChange={(category) =>
                setFormData({ ...formData, category })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleReset();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !imageFile || !formData.category}
            >
              {loading ? "Creating..." : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
