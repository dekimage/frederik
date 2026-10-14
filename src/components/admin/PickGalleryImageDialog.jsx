"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminFetch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

export default function PickGalleryImageDialog({
  open,
  onClose,
  onPick,
}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await adminFetch("/api/admin/images");
        const data = await res.json();
        if (!cancelled && data.images) {
          setImages(data.images);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const q = search.trim().toLowerCase();
  const filtered = images.filter((img) => {
    if (!q) return true;
    return (
      (img.name || "").toLowerCase().includes(q) ||
      (img.description || "").toLowerCase().includes(q)
    );
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Use image from Images library</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Picks an existing CMS image (Firestore{" "}
          <code>images</code> docs). Same file can be reused on
          many products — we will{" "}
          <span className="text-foreground">not</span> delete that Cloudinary file when this
          product is removed or you switch photos.
        </p>
        <Input
          placeholder="Search name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ScrollArea className="h-[min(50vh,360px)] pr-4">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading library…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No images match. Upload some under Admin → Images first.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    if (!img.url) return;
                    onPick({
                      url: img.url,
                      cloudinaryPublicId: img.cloudinaryPublicId || null,
                    });
                    onClose();
                  }}
                  className="text-left rounded-lg overflow-hidden border hover:border-foreground/40 focus-visible:outline focus-visible:ring-2 ring-ring"
                >
                  <div className="aspect-video bg-muted">
                    {img.url && (
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-2 text-xs text-foreground truncate">{img.name || img.id}</div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
