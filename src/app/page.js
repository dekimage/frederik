"use client";
import React, { useState, useEffect, useRef } from "react";
import springImage from "../../assets/spring.png";
import summerImage from "../../assets/summer.png";
import autumnImage from "../../assets/autumn.png";
import winterImage from "../../assets/winter.png";

import { observer } from "mobx-react-lite";
import MobxStore from "@/mobx";
import { useLanguage } from "@/contexts/LanguageContext";

import { ChevronLeft, ChevronRight } from "lucide-react";

import Link from "next/link";
import Image from "next/image";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase";

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

const ImageSkeleton = ({ className }) => (
  <div className={`bg-gray-800 animate-pulse rounded-lg ${className}`}>
    <div className="h-full w-full flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
    </div>
  </div>
);

export const AboutSection = ({ showBack = true }) => {
  const [aboutImage, setAboutImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchAboutImage = async () => {
      try {
        const docRef = doc(db, "images", "about");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAboutImage(docSnap.data().url);
        }
      } catch (error) {
        console.error("Error fetching about image:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAboutImage();
  }, []);

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 items-center">
      {/* Left Side - About Text */}
      <div className="space-y-4">
        {showBack && (
          <Link href={`/`} className="flex items-center mb-8">
            <ChevronLeft size={32} /> Back
          </Link>
        )}
        <h2 className="text-4xl font-bold text-center md:text-left">
          {t("introduction")}
        </h2>
        <p className="text-lg font-second">{t("introText1")}</p>
        <p className="text-lg font-second">{t("introText2")}</p>
        <p className="text-lg font-second">{t("introText3")}</p>
        <p className="text-lg font-second font-bold mt-4">{t("signature")}</p>
      </div>

      {/* Right Side - Image with Loading State */}
      <div className="w-full h-full">
        {loading ? (
          <ImageSkeleton className="w-full h-64 md:h-full" />
        ) : (
          <div
            className="w-full h-64 md:h-full bg-cover bg-center rounded-lg transition-opacity duration-300"
            style={{
              backgroundImage: `url("${aboutImage}")`,
            }}
          />
        )}
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

export const CategoriesSection = ({ categories, isFromShop = false }) => {
  const categoryRefs = useRef([]);
  const { t } = useLanguage();

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
    <section className="w-full">
      {/* Content */}
      <div className="relative z-10 bg-black bg-opacity-50 py-8">
        <LargeTitle title={isFromShop ? "Shop by Category" : t("categories")} />

        <div className="grid grid-cols-2 gap-4 sm:p-8">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={
                isFromShop
                  ? `/shop/${category.id}`
                  : `/category/${category.name.toLowerCase()}`
              }
            >
              <div
                ref={(el) => (categoryRefs.current[index] = el)}
                className="relative group aspect-square rounded-lg overflow-hidden opacity-0 transform translate-y-8 transition-all duration-500"
              >
                {/* Category Image with Hover Scale */}
                <div className="w-full h-full transition-transform duration-500 group-hover:scale-150">
                  <Image
                    src={category.image || getImageByCategory(category.name)}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Overlay and Text */}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-transform duration-500">
                  <h3 className="text-2xl text-white font-bold transition-transform duration-500 group-hover:scale-150">
                    {t(category.name.toLowerCase())}
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
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const reelsRef = collection(db, "reels");
        const q = query(reelsRef, orderBy("index", "asc"));
        const querySnapshot = await getDocs(q);

        const reelsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setReels(reelsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReels();
  }, []);

  const handlePlay = (id) => {
    setPlaying((prev) => ({ ...prev, [id]: true }));
  };

  if (error) {
    return (
      <section className="relative min-h-screen w-full">
        <div className="relative z-10 bg-black bg-opacity-50 py-16">
          <div className="text-4xl font-bold text-center my-8">
            {t("reels")}
          </div>
          <div className="text-center text-red-500">Error: {error}</div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="relative min-h-screen w-full">
        <div className="relative z-10 bg-black bg-opacity-50 py-16">
          <div className="text-4xl font-bold text-center my-8">
            {t("reels")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-8 sm:p-8">
            {[1, 2, 3, 4, 5, 6].map((skeleton) => (
              <div
                key={skeleton}
                className="relative h-64 bg-gray-800 rounded-lg animate-pulse"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full">
      <div className="relative z-10 bg-black bg-opacity-50 py-16">
        <div className="text-4xl font-bold text-center my-8">{t("reels")}</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-8 sm:p-8">
          {reels.map((reel) => (
            <div
              key={reel.id}
              className={` relative group h-64 bg-cover bg-center overflow-hidden transition-all duration-500 ${
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
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-500 group-hover:bg-opacity-50 cursor-pointer "
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

export const ImportantInfoSection = () => {
  const { t } = useLanguage();

  return (
    <section
      className="w-full max-w-6xl mx-auto py-12 px-4"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
        <h2 className="text-2xl font-bold text-center mb-8 text-white">
          {t("importantInfo")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                {t("websiteInfo")}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {t("websiteInfoText")}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                {t("delivery")}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {t("deliveryText")}
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                {t("orderCancellation")}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {t("orderCancellationText")}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                {t("mounting")}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {t("mountingText")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const HomePage = observer(() => {
  const [heroImage, setHeroImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        MobxStore.fetchCategories();

        // Fetch hero image
        const docRef = doc(db, "images", "hero");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setHeroImage(docSnap.data().url);
        }
      } catch (error) {
        console.error("Error fetching hero image:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-black text-white min-h-screen pt-16">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden">
        {loading ? (
          <ImageSkeleton className="w-full h-full" />
        ) : (
          <Image
            src={heroImage || "https://picsum.photos/2000/1000"} // Fallback image
            fill
            alt="Hero background"
            className="object-cover"
            priority
          />
        )}
        {/* Hero Overlay with Title */}
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {t("heroTitle")}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200">
              {t("heroSubtitle")}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center px-4 sm:px-32">
        <AboutSection showBack={false} />
        {MobxStore.categoriesLoading ? (
          <p>Loading categories...</p>
        ) : (
          <CategoriesSection categories={MobxStore.categories} />
        )}
        <ReelsSection />
        <ImportantInfoSection />
      </div>
    </div>
  );
});

export default HomePage;
