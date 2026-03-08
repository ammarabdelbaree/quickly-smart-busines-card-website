// LanguageSwitcher.jsx — Drop anywhere in your UI
import { useTranslation } from "../src/LanguageContext";

export default function LanguageSwitcher({ className = "", style = {} }) {
  const { lang, toggleLang } = useTranslation();
  
  return (
    <button
      onClick={toggleLang}
      className={`lang-switcher-btn animate-fade-in ${className}`}
      style={style}
      aria-label="Toggle language / تبديل اللغة"
    >
      {lang === "en" ? `العربية` : `English`}
    </button>
  );
}