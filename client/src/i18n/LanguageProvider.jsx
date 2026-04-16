import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANGUAGE, LANGUAGE_OPTIONS, translations } from "./translations";

const STORAGE_KEY = "finova-language";

function resolveInitialLanguage() {
  const savedLanguage = localStorage.getItem(STORAGE_KEY);
  if (translations[savedLanguage]) {
    return savedLanguage;
  }

  const browserLanguage = navigator.language;
  if (translations[browserLanguage]) {
    return browserLanguage;
  }

  return DEFAULT_LANGUAGE;
}

function getPathValue(target, path) {
  return path.split(".").reduce((current, part) => current?.[part], target);
}

function interpolate(template, params) {
  if (typeof template !== "string" || !params) {
    return template;
  }

  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    template
  );
}

function createI18nValue(language) {
  const dictionary = translations[language] || translations[DEFAULT_LANGUAGE];

  return {
    language,
    locale: language,
    languages: LANGUAGE_OPTIONS,
    setLanguage() {},
    t(path, params) {
      const value =
        getPathValue(dictionary, path) ??
        getPathValue(translations[DEFAULT_LANGUAGE], path) ??
        path;

      if (Array.isArray(value)) {
        return value;
      }

      return interpolate(value, params);
    },
    formatCurrencyFromCents(cents, currency = "BRL") {
      const value = (Number(cents) || 0) / 100;
      return new Intl.NumberFormat(language, {
        style: "currency",
        currency,
      }).format(value);
    },
    formatDate(isoDate) {
      if (!isoDate) {
        return "";
      }

      const normalized = String(isoDate).trim().slice(0, 10);
      const [year, month, day] = normalized.split("-");
      if (!year || !month || !day) {
        return "";
      }

      const date = new Date(`${year}-${month}-${day}T00:00:00`);
      if (Number.isNaN(date.getTime())) {
        return "";
      }

      return new Intl.DateTimeFormat(language, {
        dateStyle: "short",
      }).format(date);
    },
    formatDateTime(isoDateTime) {
      if (!isoDateTime) {
        return "";
      }

      const date = new Date(isoDateTime);
      if (Number.isNaN(date.getTime())) {
        return "";
      }

      return new Intl.DateTimeFormat(language, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
    },
  };
}

const defaultValue = createI18nValue(DEFAULT_LANGUAGE);
const LanguageContext = createContext(defaultValue);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(resolveInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(() => {
    const baseValue = createI18nValue(language);
    return {
      ...baseValue,
      setLanguage,
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  return useContext(LanguageContext);
}
