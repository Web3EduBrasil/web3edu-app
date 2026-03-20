"use client";

import { useTranslations } from "next-intl";

const Footer = () => {
  const t = useTranslations("landing");
  return (
    <footer className="bg-neutralbg text-neutral text-center w-full py-2 px-4 md:py-4">
      <p>© {new Date().getFullYear()} Web3EduBrasil. {t("footer")}</p>
    </footer>
  );
};

export default Footer;
