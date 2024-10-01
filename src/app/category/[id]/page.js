"use client";
import { useState } from "react";
import { FaArrowLeft, FaArrowRight, FaCamera } from "react-icons/fa";
import Image from "next/image";
import { LargeTitle } from "@/app/page";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

const images = [
  {
    id: 1,
    url: "https://picsum.photos/600/600?random=1",
    description: "Beautiful Spring Landscape 1",
  },
  {
    id: 2,
    url: "https://picsum.photos/600/600?random=2",
    description: "Beautiful Spring Landscape 2",
  },
  {
    id: 3,
    url: "https://picsum.photos/600/600?random=3",
    description: "Beautiful Spring Landscape 3",
  },
  {
    id: 4,
    url: "https://picsum.photos/600/600?random=4",
    description: "Beautiful Spring Landscape 4",
  },
  {
    id: 1,
    url: "https://picsum.photos/600/600?random=1",
    description: "Beautiful Spring Landscape 1",
  },
  {
    id: 2,
    url: "https://picsum.photos/600/600?random=2",
    description: "Beautiful Spring Landscape 2",
  },
  {
    id: 3,
    url: "https://picsum.photos/600/600?random=3",
    description: "Beautiful Spring Landscape 3",
  },
  {
    id: 4,
    url: "https://picsum.photos/600/600?random=4",
    description: "Beautiful Spring Landscape 4",
  },
  {
    id: 1,
    url: "https://picsum.photos/600/600?random=1",
    description: "Beautiful Spring Landscape 1",
  },
  {
    id: 2,
    url: "https://picsum.photos/600/600?random=2",
    description: "Beautiful Spring Landscape 2",
  },
  {
    id: 3,
    url: "https://picsum.photos/600/600?random=3",
    description: "Beautiful Spring Landscape 3",
  },
  {
    id: 4,
    url: "https://picsum.photos/600/600?random=4",
    description: "Beautiful Spring Landscape 4",
  },
];

const CategoryPage = ({ params }) => {
  const { id } = params;
  const category = id;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
    <div className="bg-black text-white  min-h-[1000px] pt-16 flex flex-col justify-center items-center">
      <div className="flex flex-col justify-center items-center px-4 sm:px-8">
        {/* Category Title */}
        <LargeTitle title={category?.toUpperCase()} />
        <Link href="/shop">
          <Button className="my-8 h-[55px] w-[200px] text-lg bg-white text-black hover:bg-gray-400">
            BUY IMAGES <ShoppingBag size={24} className="ml-2" />
          </Button>
        </Link>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group overflow-hidden cursor-pointer"
              onClick={() => handleImageClick(index)}
            >
              {/* Image */}
              <Image
                src={image.url}
                alt={`Image ${index + 1}`}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-40 transition-opacity duration-300 flex items-center justify-center">
                <FaCamera className="text-black text-4xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Image Viewer Modal */}
        {isModalOpen && (
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
