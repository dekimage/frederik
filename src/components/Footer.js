"use client";

import Link from "next/link";
import {
  FaFacebook,
  FaYoutube,
  FaInstagram,
  FaEnvelope,
} from "react-icons/fa";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-black border-t border-white text-white text-center py-8 font-sans">
      <div className="mb-4">
        <Link href="/cart" className="text-lg font-bold">
          {t("footerViewCart")}
        </Link>
      </div>

      <div className="mb-4">{t("footerCopyright")}</div>

      <div className="mb-4 space-x-4">
        <Link href="/track-order">{t("trackOrder")}</Link>
        <span>|</span>
        <Link href="/privacy-policy">{t("privacyPolicy")}</Link>
        <span>|</span>
        <Link href="/copyright-statement">{t("copyright")}</Link>
        <span>|</span>
        <Link href="/cookies-policy">{t("cookies")}</Link>
      </div>

      <div className="flex justify-center space-x-6 mt-4">
        <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer">
          <FaFacebook className="text-xl" />
        </Link>
        <Link href="https://youtube.com" target="_blank" rel="noopener noreferrer">
          <FaYoutube className="text-xl" />
        </Link>
        <Link href="mailto:contact@wolfskinphotography.com">
          <FaEnvelope className="text-xl" />
        </Link>
        <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer">
          <FaInstagram className="text-xl" />
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
