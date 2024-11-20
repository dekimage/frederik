"use client";
import { useState, useEffect } from "react";

import { collection, query, where, getDocs } from "firebase/firestore";
import { FaArrowLeft, FaArrowRight, FaCamera } from "react-icons/fa";
import Image from "next/image";
import { LargeTitle } from "@/app/page";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { db } from "@/firebase";

const ImageSkeleton = () => (
  <div className="relative w-full h-[600px] bg-gray-800 animate-pulse rounded-lg">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
    </div>
  </div>
);

const CategoryPage = ({ params }) => {
  const { id } = params;
  const category = id;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        // Normalize the category (lowercase and trim)
        const normalizedCategory = category.toLowerCase().trim();

        const imagesRef = collection(db, "images");
        // Use case-insensitive query if your database supports it
        // or query for both cases
        const q = query(
          imagesRef,
          where("category", "in", [
            normalizedCategory,
            normalizedCategory.charAt(0).toUpperCase() +
              normalizedCategory.slice(1),
          ])
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.log("No documents found");
          return;
        }

        const fetchedImages = querySnapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            ...data,
            index: data.index || 0, // Ensure index exists
          };
        });

        // Sort images by index
        const sortedImages = fetchedImages.sort((a, b) => a.index - b.index);
        setImages(sortedImages);
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [category]);

  // Open the image modal
  const handleImageClick = (index) => {
    setActiveImageIndex(index);
    setIsModalOpen(true);
  };

  // Handle navigating through images
  const handleNextImage = () => {
    setActiveImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePreviousImage = () => {
    setActiveImageIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  return (
    <div className="bg-black text-white min-h-[1000px] pt-16 flex flex-col justify-center items-center">
      <div className="flex flex-col justify-center items-center px-4 sm:px-8 mt-16">
        <LargeTitle title={category?.toUpperCase()} />
        <Link href={`/shop/${category}`}>
          <Button className="my-8 h-[55px] w-[200px] text-lg bg-white text-black hover:bg-gray-400">
            BUY IMAGES <ShoppingBag size={24} className="ml-2" />
          </Button>
        </Link>

        {/* Image Grid with Loading State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            // Show skeletons while loading
            [...Array(8)].map((_, index) => <ImageSkeleton key={index} />)
          ) : images.length === 0 ? (
            // Show message if no images found
            <div className="col-span-2 text-center py-20">
              <p className="text-xl">No images found for this category</p>
            </div>
          ) : (
            // Show actual images
            images.map((image, index) => (
              <div
                key={image.id}
                className="relative group overflow-hidden cursor-pointer"
                onClick={() => handleImageClick(index)}
              >
                <Image
                  src={image.url}
                  alt={image.description || `Image ${index + 1}`}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-40 transition-opacity duration-300 flex items-center justify-center">
                  <FaCamera className="text-black text-4xl" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Image Viewer Modal */}
        {isModalOpen && images.length > 0 && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={() => setIsModalOpen(false)}
          >
            {/* Image Container */}
            <div
              className="relative w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Active Image */}
              <Image
                src={images[activeImageIndex].url}
                alt={`Active Image`}
                className="w-full h-auto object-contain"
                width={600}
                height={600}
                onClick={handleNextImage}
              />

              {/* Image Description */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center p-4">
                {images[activeImageIndex].description}
              </div>

              {/* Left Arrow */}
              <div
                className="absolute left-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-300 hover:text-white"
                onClick={handlePreviousImage}
              >
                <FaArrowLeft size={40} />
              </div>

              {/* Right Arrow */}
              <div
                className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-300 hover:text-white"
                onClick={handleNextImage}
              >
                <FaArrowRight size={40} />
              </div>

              {/* Close Modal */}
              <div
                className="absolute top-4 right-4 text-white cursor-pointer text-3xl"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
