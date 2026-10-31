"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import MobxStore from "@/mobx";
import { useLanguage } from "@/contexts/LanguageContext";
import { categoryLabel } from "@/lib/catalog";
import logoImg from "../../public/logo2.png";

const Header = observer(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, changeLanguage, t } = useLanguage();
  useEffect(() => {
    MobxStore.fetchCategories();
  }, []);
  const languages = (
    <div
      className="flex items-center justify-center gap-2 font-sans"
      aria-label={t("Language")}
    >
      {[
        ["en", "English"],
        ["nl", "Nederlands"],
      ].map(([code, label]) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={language === code}
          onClick={() => changeLanguage(code)}
          className={`rounded border px-2 py-2 text-sm ${language === code ? "border-white bg-white text-black" : "border-gray-600 text-white"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
  const close = () => setIsMenuOpen(false);
  return (
    <header className="fixed border-b border-white top-0 left-0 w-full bg-black text-white h-20 sm:h-24 md:h-28 lg:h-32 flex items-center justify-between gap-2 px-3 sm:px-6 z-50">
      <Link
        href="/"
        onClick={close}
        className="min-w-0 flex-1 max-w-[260px] sm:max-w-[340px]"
        aria-label="WOLFSKIN Photography"
      >
        <Image
          src={logoImg}
          alt="WOLFSKIN Photography"
          className="block w-full h-auto max-h-16 sm:max-h-20 lg:max-h-24 object-contain object-left"
          priority
        />
      </Link>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <Link
          href="/cart"
          onClick={close}
          aria-label={t("Shopping cart")}
          className="relative p-3 rounded-full hover:bg-gray-800"
        >
          <ShoppingCart className="h-6 w-6" />
          {MobxStore.cartItemsCount > 0 && (
            <span className="absolute right-0 top-0 rounded-full bg-red-500 px-1 text-xs">
              {MobxStore.cartItemsCount > 99 ? "99+" : MobxStore.cartItemsCount}
            </span>
          )}
        </Link>
        <div className="hidden md:block">{languages}</div>
        <button
          type="button"
          aria-label={t(isMenuOpen ? "Close menu" : "Menu")}
          aria-expanded={isMenuOpen}
          aria-controls="storefront-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="p-3 rounded-full hover:bg-gray-800"
        >
          {isMenuOpen ? (
            <FaTimes className="h-6 w-6" />
          ) : (
            <FaBars className="h-6 w-6" />
          )}
        </button>
      </div>
      {isMenuOpen && (
        <nav
          id="storefront-menu"
          className="absolute left-0 top-full w-full max-h-[calc(100dvh-5rem)] overflow-y-auto border-y border-white bg-black py-6"
        >
          <div className="mb-5 md:hidden">{languages}</div>
          <ul className="mx-auto w-fit space-y-4 text-center font-ethnocentric text-sm">
            {[
              ["/", "home"],
              ["/about", "about"],
              ["/important-information", "importantInformationNav"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link onClick={close} href={href}>
                  {t(label)}
                </Link>
              </li>
            ))}
            <li>
              <hr className="border-gray-600" />
            </li>
            {MobxStore.categoriesLoading ? (
              <li>{t("Loading categories...")}</li>
            ) : (
              MobxStore.categories.map((category) => (
                <li key={category.id}>
                  <Link
                    onClick={close}
                    href={`/category/${encodeURIComponent(category.id)}`}
                  >
                    {categoryLabel(category, t)}
                  </Link>
                </li>
              ))
            )}
            <li>
              <hr className="border-gray-600" />
            </li>
            {[
              ["/shop", "shop"],
              ["/cart", "cart"],
              ["/track-order", "trackOrder"],
              ["/privacy-policy", "privacyPolicy"],
              ["/copyright-statement", "copyright"],
              ["/cookies-policy", "cookies"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link onClick={close} href={href}>
                  {t(label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
});
export default Header;
