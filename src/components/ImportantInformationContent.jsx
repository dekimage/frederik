"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

function CollapseBlock({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-md border border-gray-600 bg-gray-900/80 px-4 py-3 text-left text-sm font-medium text-white hover:bg-gray-800 transition-colors"
      >
        <span>{label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-2 border-l-2 border-gray-600 pl-4 text-sm leading-relaxed text-gray-300 whitespace-pre-line">
          {children}
        </div>
      )}
    </div>
  );
}

function MaterialSection({ prefix }) {
  const { t } = useLanguage();
  return (
    <section className="space-y-3">
      <h3 className="font-ethnocentric text-base md:text-lg tracking-wide">
        {t(`${prefix}_title`)}
      </h3>
      <CollapseBlock label={t(`${prefix}_sizes_btn`)}>
        {t(`${prefix}_sizes_body`)}
      </CollapseBlock>
      <CollapseBlock label={t(`${prefix}_more_btn`)}>
        {t(`${prefix}_more_body`)}
      </CollapseBlock>
    </section>
  );
}

const MATERIAL_PREFIXES = [
  "inf_photo",
  "inf_canvas",
  "inf_alu",
  "inf_plexi",
  "inf_forex",
  "inf_wood",
];

export default function ImportantInformationContent() {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 space-y-14 text-gray-200">
      <section className="space-y-4 pt-4">
        <h1 className="font-ethnocentric text-2xl md:text-3xl lg:text-4xl tracking-wide">
          {t("inf_web_title")}
        </h1>
        <p className="font-sans text-base leading-relaxed whitespace-pre-line">
          {t("inf_web_body")}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-ethnocentric text-xl md:text-2xl lg:text-3xl tracking-wide">
          {t("inf_mat_title")}
        </h2>
        <p className="font-sans text-base leading-relaxed">{t("inf_mat_intro")}</p>

        <div className="space-y-12 pt-6">
          {MATERIAL_PREFIXES.map((prefix) => (
            <MaterialSection key={prefix} prefix={prefix} />
          ))}
        </div>
      </section>

      {(["inf_delivery", "inf_cancel", "inf_damage", "inf_mount"]).map(
        (prefix) => (
          <section key={prefix} className="space-y-4">
            <h2 className="font-ethnocentric text-xl md:text-2xl lg:text-3xl tracking-wide">
              {t(`${prefix}_title`)}
            </h2>
            <p className="font-sans text-base leading-relaxed whitespace-pre-line">
              {t(`${prefix}_body`)}
            </p>
          </section>
        )
      )}
    </div>
  );
}
