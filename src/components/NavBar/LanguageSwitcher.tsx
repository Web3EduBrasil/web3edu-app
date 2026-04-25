"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

const LOCALES = [
  { code: "pt", label: "PT", flag: "🇧🇷" },
  { code: "en", label: "EN", flag: "🇺🇸" },
  { code: "es", label: "ES", flag: "🇪🇸" },
];

export const LanguageSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();

  const handleChange = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-sm gap-1 text-neutral font-medium"
      >
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-neutralbg rounded-box z-[12] w-32 p-1 shadow-lg border border-cgray"
      >
        {LOCALES.map((l) => (
          <li key={l.code}>
            <button
              onClick={() => handleChange(l.code)}
              className={`flex gap-2 ${locale === l.code ? "font-bold text-dgreen" : "text-neutral"}`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
