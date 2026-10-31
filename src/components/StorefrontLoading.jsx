"use client";
import { useLanguage } from "@/contexts/LanguageContext";
export default function StorefrontLoading() {
  const { t } = useLanguage();
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      role="status"
    >
      {t("Loading...")}
    </div>
  );
}
