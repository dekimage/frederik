"use client";

import { adminFetch } from "@/lib/adminFetch";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Trash2Icon,
  PlusCircleIcon,
  PencilIcon,
  SaveIcon,
  XIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrencyEUR } from "@/lib/orderUtils";

export default function AdminDashboard() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [editingCategory, setEditingCategory] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminFetch("/api/admin/dashboard");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load dashboard statistics.");
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
      setError(error.message || "Unable to load dashboard statistics.");
    }
  };

  const fetchCategories = async () => {
    setError("");
    try {
      const response = await adminFetch("/api/admin/categories");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load categories.");
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError(error.message || "Unable to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const response = await adminFetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCategory }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add category");
      }

      setNewCategory("");
      fetchCategories();
      fetchStats();
    } catch (error) {
      console.error("Error adding category:", error);
      setError(error.message || "Unable to add category.");
    }
  };

  const handleRenameCategory = async () => {
    if (!editingCategory?.name.trim()) return;
    try {
      const response = await adminFetch(
        `/api/admin/categories/${editingCategory.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: editingCategory.name }),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to rename category");
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      setError(error.message || "Unable to rename category.");
    }
  };

  const handleDeleteCategory = async () => {
    try {
      const response = await adminFetch(`/api/admin/categories/${deleteDialog.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete category");
      }

      setDeleteDialog({ open: false, id: null });
      fetchCategories();
      fetchStats();
    } catch (error) {
      console.error("Error deleting category:", error);
      setError(error.message || "Unable to delete category.");
      setDeleteDialog({ open: false, id: null });
    }
  };

  return (
    <div className="container mx-auto py-10">
        <div className="grid gap-8">
          {/* Categories Section */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Manage categories for products and images
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
              <form onSubmit={handleAddCategory} className="flex gap-4 mb-6">
                <div className="flex-1 max-w-sm">
                  <Label htmlFor="newCategory">New Category Name</Label>
                  <Input
                    id="newCategory"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter category name"
                  />
                </div>
                <Button type="submit" className="mt-8">
                  <PlusCircleIcon className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </form>

              {loading ? (
                <div>Loading categories...</div>
              ) : (
                <div className="grid gap-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      {editingCategory?.id === category.id ? (
                        <Input
                          value={editingCategory.name}
                          onChange={(event) =>
                            setEditingCategory({
                              ...editingCategory,
                              name: event.target.value,
                            })
                          }
                          className="max-w-sm"
                          autoFocus
                        />
                      ) : (
                        <span>{category.name}</span>
                      )}
                      <div className="flex gap-2">
                        {editingCategory?.id === category.id ? (
                          <>
                            <Button size="icon" onClick={handleRenameCategory}>
                              <SaveIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setEditingCategory(null)}
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              setEditingCategory({
                                id: category.id,
                                name: category.name,
                              })
                            }
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              id: category.id,
                            })
                          }
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              ["Live paid revenue", formatCurrencyEUR(stats?.livePaidRevenue || 0)],
              ["Live orders", stats?.liveOrders ?? "—"],
              ["Pending fulfillment", stats?.pendingFulfillment ?? "—"],
              ["Email failures", stats?.emailFailures ?? "—"],
              ["Active TEST orders", stats?.testOrders ?? "—"],
              ["All active orders", stats?.activeOrders ?? "—"],
              [
                "Products",
                stats ? `${stats.products} (${stats.draftProducts} draft)` : "—",
              ],
              ["Images", stats?.images ?? "—"],
              ["Categories", stats?.categories ?? categories.length],
            ].map(([label, value]) => (
              <Card key={label}>
                <CardHeader className="pb-2">
                  <CardDescription>{label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onOpenChange={(open) =>
            setDeleteDialog((prev) => ({ ...prev, open }))
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this category? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, id: null })}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCategory}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
