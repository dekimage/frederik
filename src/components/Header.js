"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";
import { ShoppingCart, ChevronDown } from "lucide-react";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import MobxStore from "../mobx";
import { useLanguage } from "@/contexts/LanguageContext";
import logoImg from "../../public/logo2.png";

const Header = observer(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const { language, changeLanguage, t } = useLanguage();
  const languageRef = useRef(null);

  useEffect(() => {
    MobxStore.fetchCategories();
  }, []);

  // Handle click outside language dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleLanguage = () => {
    setIsLanguageOpen(!isLanguageOpen);
  };

  const handleLanguageChange = (newLanguage) => {
    changeLanguage(newLanguage);
    setIsLanguageOpen(false);
  };

  const getLanguageFlag = (lang) => {
    switch (lang) {
      case "en":
        return "/en.png";
      case "nl":
        return "/nl.png";
      default:
        return "/en.png";
    }
  };

  return (
    <header className="fixed border-b border-white top-0 left-0 w-full bg-black text-white h-20 sm:h-24 md:h-28 lg:h-32 flex items-center justify-between px-6 z-50">
      {/* Logo Placeholder */}
      <Link href="/">
        <div className="flex items-center">
          <Image
            width={1000}
            height={1000}
            src={logoImg}
            alt="WOLFSKIN Photography"
            className="w-auto h-16 sm:h-20 md:h-22 lg:h-24"
            priority
          />
        </div>
      </Link>

      {/* Cart, language, and menu — always visible in the top bar */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Cart Icon with Count */}
        <Link href="/cart" className="relative">
          <div className="p-3 hover:bg-gray-800 rounded-full transition-colors">
            <ShoppingCart className="w-6 h-6 text-white" />
            {MobxStore.cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {MobxStore.cartItemsCount > 99
                  ? "99+"
                  : MobxStore.cartItemsCount}
              </span>
            )}
          </div>
        </Link>

        {/* Language Switcher */}
        <div className="relative" ref={languageRef}>
          <div
            className="p-3 hover:bg-gray-800 rounded-full transition-colors cursor-pointer flex items-center space-x-1"
            onClick={toggleLanguage}
          >
            <Image
              src={getLanguageFlag(language)}
              alt={`${language.toUpperCase()} flag`}
              width={20}
              height={15}
              className="rounded-sm"
            />
            <ChevronDown className="w-4 h-4 text-white" />
          </div>

          {/* Language Dropdown */}
          {isLanguageOpen && (
            <div className="absolute right-0 mt-2 w-20 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
              <div
                className="px-3 py-2 hover:bg-gray-800 cursor-pointer flex items-center justify-center space-x-2 transition-colors"
                onClick={() => handleLanguageChange("en")}
              >
                <Image
                  src="/en.png"
                  alt="EN flag"
                  width={20}
                  height={15}
                  className="rounded-sm"
                />
                <span className="text-sm font-medium">EN</span>
              </div>
              <div
                className="px-3 py-2 hover:bg-gray-800 cursor-pointer flex items-center justify-center space-x-2 transition-colors"
                onClick={() => handleLanguageChange("nl")}
              >
                <Image
                  src="/nl.png"
                  alt="NL flag"
                  width={20}
                  height={15}
                  className="rounded-sm"
                />
                <span className="text-sm font-medium">NL</span>
              </div>
            </div>
          )}
        </div>

        {/* Hamburger Menu */}
        <div
          className="p-3 hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
          onClick={toggleMenu}
        >
          {isMenuOpen ? (
            <FaTimes className="w-6 h-6 text-white" />
          ) : (
            <FaBars className="w-6 h-6 text-white" />
          )}
        </div>
      </div>

      {/* Fullscreen Menu */}
      <div
        className={`border-b border-t border-white absolute top-full left-0 w-full bg-black text-white flex flex-col transition-all duration-500 ease-in-out overflow-hidden ${
          isMenuOpen ? "max-h-screen" : "max-h-0"
        }`}
      >
        {/* Navigation Menu */}
        <div className="flex items-center justify-center flex-1">
          <ul className="space-y-4 text-center text-md py-8 w-[220px] font-ethnocentric text-sm tracking-wide">
            {/* Home and About */}
            <li
              onClick={toggleMenu}
              className="uppercase hover:text-gray-400 transition-colors duration-300"
            >
              <Link href="/">{t("home")}</Link>
            </li>
            <li
              onClick={toggleMenu}
              className="uppercase hover:text-gray-400 transition-colors duration-300"
            >
              <Link href="/about">{t("about")}</Link>
            </li>
            <li
              onClick={toggleMenu}
              className="uppercase hover:text-gray-400 transition-colors duration-300"
            >
              <Link href="/important-information">
                {t("importantInformationNav")}
              </Link>
            </li>

            {/* Separator Line */}
            <hr className="border-t border-white my-2" />

            {/* Categories */}
            {MobxStore.categoriesLoading ? (
              <li>Loading categories...</li>
            ) : (
              MobxStore.categories.map((category) => (
                <li
                  key={category.id}
                  onClick={toggleMenu}
                  className="uppercase hover:text-gray-400 transition-colors duration-300"
                >
                  <Link href={`/category/${category.name.toLowerCase()}`}>
                    {t(category.name.toLowerCase())}
                  </Link>
                </li>
              ))
            )}

            {/* Separator Line */}
            <hr className="border-t border-white my-2" />

            {/* Shop and Cart */}
            <li
              onClick={toggleMenu}
              className="uppercase hover:text-gray-400 transition-colors duration-300"
            >
              <Link href="/shop">{t("shop")}</Link>
            </li>
            <li
              onClick={toggleMenu}
              className="uppercase hover:text-gray-400 transition-colors duration-300"
            >
              <Link href="/cart">{t("cart")}</Link>
            </li>

            {/* Separator Line */}
            <hr className="border-t border-white my-2" />

            {/* Legal Links */}
            <li
              onClick={toggleMenu}
              className="uppercase hover:text-gray-400 transition-colors duration-300"
            >
              <Link href="/privacy-policy">{t("privacyPolicy")}</Link>
            </li>
            <li
              onClick={toggleMenu}
              className="uppercase hover:text-gray-400 transition-colors duration-300"
            >
              <Link href="/copyright-statement">{t("copyright")}</Link>
            </li>
            <li
              onClick={toggleMenu}
              className="uppercase hover:text-gray-400 transition-colors duration-300"
            >
              <Link href="/cookies-policy">{t("cookies")}</Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
});

export default Header;
