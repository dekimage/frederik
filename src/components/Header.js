"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import MobxStore from "../mobx";
import logoImg from "../../public/logo.png";

const Header = observer(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    MobxStore.fetchCategories();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
            alt="Logo"
            className="w-auto h-16 sm:h-20 md:h-22 lg:h-24"
          />
        </div>
      </Link>

      {/* Hamburger Menu */}
      <div className="text-4xl cursor-pointer" onClick={toggleMenu}>
        {isMenuOpen ? <FaTimes /> : <FaBars />}
      </div>

      {/* Fullscreen Menu */}
      <div
        className={`border-b border-t border-white absolute top-full left-0 w-full bg-black text-white flex items-center justify-center transition-all duration-500 ease-in-out overflow-hidden ${isMenuOpen ? "max-h-screen" : "max-h-0"
          }`}
      >
        <ul className="space-y-4 text-center text-md py-8 w-[150px]">
          {/* Home and About */}
          <li
            onClick={toggleMenu}
            className="uppercase hover:text-gray-400 transition-colors duration-300"
          >
            <Link href="/">Home</Link>
          </li>
          <li
            onClick={toggleMenu}
            className="uppercase hover:text-gray-400 transition-colors duration-300"
          >
            <Link href="/about">About</Link>
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
                  {category.name}
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
            <Link href="/shop">Shop</Link>
          </li>
          <li
            onClick={toggleMenu}
            className="uppercase hover:text-gray-400 transition-colors duration-300"
          >
            <Link href="/cart">Cart</Link>
          </li>

          {/* Separator Line */}
          <hr className="border-t border-white my-2" />

          {/* Legal Links */}
          <li
            onClick={toggleMenu}
            className="uppercase hover:text-gray-400 transition-colors duration-300"
          >
            <Link href="/privacy-policy">Privacy Policy</Link>
          </li>
          <li
            onClick={toggleMenu}
            className="uppercase hover:text-gray-400 transition-colors duration-300"
          >
            <Link href="/copyright-statement">Copyright</Link>
          </li>
        </ul>
      </div>
    </header>
  );
});

export default Header;
