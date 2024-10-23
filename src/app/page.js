"use client";
import React, { useState, useEffect, useRef } from "react";
import springImage from "../../assets/spring.png";
import summerImage from "../../assets/summer.png";
import autumnImage from "../../assets/autumn.png";
import winterImage from "../../assets/winter.png";

import { observer } from "mobx-react-lite";
import MobxStore from "@/mobx";

import { ChevronRight } from "lucide-react";

import Link from "next/link";
import Image from "next/image";

export const categories = [
  { id: "spring", name: "Spring" },
  { id: "summer", name: "Summer" },
  { id: "autumn", name: "Autumn" },
  { id: "winter", name: "Winter" },
];

export const TitleDescription = ({ title, description, seeMore, button }) => {
  return (
    <div className="flex items-center justify-between mb-4 w-full">
      <div className="space-y-1 mr-4">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {button && button}
      {seeMore && (
        <Link href={`/slug/${seeMore}`}>
          <div className="flex items-center cursor-pointer opacity-70 text-sm font-bold hover:border-b-2">
            See all <ChevronRight size={16} />
          </div>
        </Link>
      )}
    </div>
  );
};

export const AboutSection = () => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 items-center">
      {/* Left Side - About Text */}
      <div className="space-y-4">
        <h2 className="text-4xl font-bold text-center md:text-left">
          About Me
        </h2>
        <p className="text-lg">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent
          viverra nisl ut justo pharetra, ut pharetra lacus ultricies.
        </p>
        <p className="text-lg">
          Curabitur malesuada felis non purus blandit, vitae interdum urna
          condimentum. Vivamus placerat ipsum et urna consequat venenatis.
        </p>
        <p className="text-lg">
          Nullam dictum magna nec urna malesuada, ac auctor nisi interdum. Etiam
          at nunc ut enim posuere bibendum ut vitae felis.
        </p>
      </div>

      {/* Right Side - Image */}
      <div className="w-full h-full">
        <div
          className="w-full h-64 md:h-full bg-cover bg-center"
          style={{
            backgroundImage: `url("https://picsum.photos/600/600")`,
          }}
        ></div>
      </div>
    </section>
  );
};

const getImageByCategory = (category) => {
  switch (category) {
    case "Spring":
      return springImage;
    case "Summer":
      return summerImage;
    case "Autumn":
      return autumnImage;
    case "Winter":
      return winterImage;
    default:
      return null;
  }
};

const CategoriesSection = ({ categories }) => {
  const categoryRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-jump");
          }
        });
      },
      { threshold: 0.1 } // Adjust the threshold if needed
    );

    categoryRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      categoryRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);
  return (
    <section className="w-full min-h-screen">
      {/* Content */}
      <div className="relative z-10 bg-black bg-opacity-50 py-16">
        <LargeTitle title="Categories" />

        <div className="grid grid-cols-2 gap-4 p-8">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/category/${category.name.toLowerCase()}`}
            >
              <div
                ref={(el) => (categoryRefs.current[index] = el)}
                className="relative group h-64 rounded-lg overflow-hidden opacity-0 transform translate-y-8 transition-all duration-500"
              >
                {/* Category Image with Hover Scale */}
                <div className="w-full h-full transition-transform duration-500 group-hover:scale-150">
                  <Image
                    src={category.image || getImageByCategory(category.name)}
                    alt={category.name}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>

                {/* Overlay and Text */}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-transform duration-500">
                  <h3 className="text-2xl text-white font-bold transition-transform duration-500 group-hover:scale-150">
                    {category.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export const ReelsSection = () => {
  const [playing, setPlaying] = useState({});
  const reels = [
    { id: "1", videoId: "KIzAhyvvlkA" },
    { id: "2", videoId: "hXVGP0yP194" },
    { id: "3", videoId: "R9RePuPo9iA" },
    { id: "4", videoId: "KIzAhyvvlkA" },
    { id: "5", videoId: "hXVGP0yP194" },
    { id: "6", videoId: "R9RePuPo9iA" },
  ];

  const handlePlay = (id) => {
    setPlaying((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section className="relative min-h-screen w-full">
      <div className="relative z-10 bg-black bg-opacity-50 py-16">
        <div className="text-4xl font-bold text-center my-8">Reels</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
          {reels.map((reel) => (
            <div
              key={reel.id}
              className={`relative group h-64 bg-cover bg-center rounded-lg overflow-hidden transition-all duration-500 ${
                playing[reel.id] ? "" : " transform"
              }`}
              style={{
                backgroundImage: !playing[reel.id]
                  ? `url('https://img.youtube.com/vi/${reel.videoId}/0.jpg')`
                  : "none",
              }}
            >
              {/* Overlay and Play Button */}
              {!playing[reel.id] && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-500 group-hover:bg-opacity-50 cursor-pointer"
                  onClick={() => handlePlay(reel.id)}
                >
                  <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      className="w-8 h-8 text-black"
                    >
                      <path d="M3 22V2l18 10L3 22z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* YouTube Player */}
              {playing[reel.id] && (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${reel.videoId}?autoplay=1`}
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                ></iframe>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const LargeTitle = ({ title }) => {
  return <div className="text-4xl font-bold text-center my-8">{title}</div>;
};

const HomePage = observer(() => {
  useEffect(() => {
    MobxStore.fetchCategories();
    // ... other fetch calls if needed
  }, []);

  return (
    <div className="bg-black text-white  min-h-[1000px] pt-16 flex flex-col justify-center items-center">
      <Image
        src="https://picsum.photos/2000/1000"
        width={1920}
        height={1080}
        alt="bg"
      />
      <div className="flex flex-col justify-center items-center px-4 sm:px-8">
        <AboutSection />
        {MobxStore.categoriesLoading ? (
          <p>Loading categories...</p>
        ) : (
          <CategoriesSection categories={MobxStore.categories} />
        )}
        <ReelsSection />
      </div>
    </div>
  );
});

export default HomePage;
