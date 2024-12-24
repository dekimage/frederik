import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { EditIcon, TrashIcon, SaveIcon, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CategorySelect from "./CategorySelect";
import { Label } from "../ui/label";

export default function ImageCard({ image, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState(image);
  const [loading, setLoading] = useState(false);
  const [newImageFile, setNewImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(image.url);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let updatedData = { ...formData };

      // If there's a new image file, upload it first
      if (newImageFile) {
        const formDataWithFile = new FormData();
        formDataWithFile.append("file", newImageFile);
        formDataWithFile.append("imageData", JSON.stringify(formData));

        const uploadResponse = await fetch("/api/admin/images/upload", {
          method: "POST",
          body: formDataWithFile,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload new image");
        const { url } = await uploadResponse.json();
        updatedData.url = url;
      }

      const response = await fetch(`/api/admin/images/${image.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error("Failed to update image");
      onUpdate();
      setIsEditing(false);
      setNewImageFile(null);
    } catch (error) {
      console.error("Error updating image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/images/${image.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete image");
      onUpdate();
    } catch (error) {
      console.error("Error deleting image:", error);
    } finally {
      setLoading(false);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="aspect-video relative">
          <img
            src={imagePreview}
            alt={formData.name}
            className="w-full h-full object-cover"
          />
          {isEditing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center p-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id={`file-upload-${image.id}`}
                />
                <label
                  htmlFor={`file-upload-${image.id}`}
                  className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-white text-gray-900 rounded-md hover:bg-gray-100"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Change Image
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor={`name-${image.id}`}>Image Name</Label>
                <Input
                  id={`name-${image.id}`}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Image name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`description-${image.id}`}>Description</Label>
                <Textarea
                  id={`description-${image.id}`}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Image description"
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <CategorySelect
                  value={formData.category}
                  onValueChange={(category) =>
                    setFormData({ ...formData, category })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`index-${image.id}`}>Display Order</Label>
                <Input
                  id={`index-${image.id}`}
                  type="number"
                  value={formData.index || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      index: parseInt(e.target.value),
                    })
                  }
                  placeholder="0"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setImagePreview(image.url);
                    setNewImageFile(null);
                    setFormData(image);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-semibold">{image.name}</h3>
              <p className="text-sm text-gray-500">{image.description}</p>
              <p className="text-sm text-gray-500">
                Category: {image.category || "Not set"}
              </p>
              <p className="text-sm text-gray-500">
                Display Order: {image.index || "0"}
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleting(true)}
                  disabled={loading}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Image</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
