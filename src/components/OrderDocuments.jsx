"use client";
import { useLanguage } from "@/contexts/LanguageContext";

export default function OrderDocuments({ invoice }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-2 mt-4">
      {[
        [invoice?.hostedInvoiceUrl, "Stripe invoice"],
        [invoice?.invoicePdf, "Download Stripe invoice PDF"],
      ]
        .filter(([url]) => url)
        .map(([url, label]) => (
          <p key={label}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              {t(label)}
            </a>
          </p>
        ))}
    </div>
  );
}
