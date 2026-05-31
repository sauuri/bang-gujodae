"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Lang, getLang, setLang } from "./i18n";

const LangContext = createContext<{
  lang: Lang;
  toggle: () => void;
}>({ lang: "ko", toggle: () => {} });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");

  useEffect(() => {
    setLangState(getLang());
  }, []);

  function toggle() {
    const next: Lang = lang === "ko" ? "en" : "ko";
    setLang(next);
    setLangState(next);
  }

  return (
    <LangContext.Provider value={{ lang, toggle }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
