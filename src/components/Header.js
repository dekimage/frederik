"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";
import { ChevronDown, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import MobxStore from "@/mobx";
import { useLanguage } from "@/contexts/LanguageContext";
import { categoryLabel } from "@/lib/catalog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoImg from "../../public/logo2.png";

const languageOptions = [
  ["en", "English"],
  ["nl", "Nederlands"],
];

const LanguageFlag = ({ code }) => (
  <Image
    src={`/${code}.png`}
    alt=""
    width={20}
    height={15}
    unoptimized
    className="rounded-sm"
  />
);

const Header = observer(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, changeLanguage, t } = useLanguage();
  useEffect(() => {
    MobxStore.fetchCategories();
  }, []);
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
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            aria-label={`${t("Language")} (${language.toUpperCase()})`}
            className="flex min-h-11 items-center gap-1 rounded-full px-2 font-sans text-xs font-semibold uppercase tracking-wide hover:bg-gray-800 sm:gap-2 sm:px-3"
          >
            <LanguageFlag code={language} />
            <span className="hidden sm:inline">{language}</span>
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-24">
            <DropdownMenuRadioGroup
              value={language}
              onValueChange={changeLanguage}
            >
              {languageOptions.map(([code, label]) => (
                <DropdownMenuRadioItem
                  key={code}
                  value={code}
                  lang={code}
                  aria-label={label}
                  className="min-h-11 cursor-pointer gap-2 uppercase"
                >
                  <LanguageFlag code={code} />
                  {code}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
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
