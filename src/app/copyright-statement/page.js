"use client";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CopyrightStatementPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">
          {t("copyrightTitle")}
        </h1>

        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-line text-gray-300 leading-relaxed">
              {t("copyrightContent")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
