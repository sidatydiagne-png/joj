import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { EN } from "./en.js";

// Langue FR / EN mémorisée dans le navigateur (même clé que le thème WordPress : dk_lang).
// t("Texte en français") renvoie la traduction anglaise si elle existe, sinon le texte tel quel.
const LangContext = createContext(null);
const norm = (s) => s.replace(/\s+/g, " ").trim();

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem("dk_lang") === "en" ? "en" : "fr";
    } catch {
      return "fr";
    }
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l) => {
    const value = l === "en" ? "en" : "fr";
    setLangState(value);
    try {
      localStorage.setItem("dk_lang", value);
    } catch {
      /* stockage indisponible : on garde la langue pour cette session */
    }
  }, []);

  const t = useCallback((fr) => (lang === "en" && EN[norm(fr)]) || fr, [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
