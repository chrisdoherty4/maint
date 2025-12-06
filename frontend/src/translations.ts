import deTranslations from "../translations/de.json";
import enTranslations from "../translations/en.json";
import esTranslations from "../translations/es.json";
import frTranslations from "../translations/fr.json";
import nlTranslations from "../translations/nl.json";
import ptTranslations from "../translations/pt.json";

type TranslationValue = string | TranslationTree;
type TranslationTree = { [key: string]: TranslationValue };

const INTEGRATION_PREFIX = "component.maint";

const RAW_TRANSLATIONS: Record<string, TranslationTree> = {
  de: deTranslations as TranslationTree,
  en: enTranslations as TranslationTree,
  es: esTranslations as TranslationTree,
  fr: frTranslations as TranslationTree,
  nl: nlTranslations as TranslationTree,
  pt: ptTranslations as TranslationTree
};

const flattenTranslations = (
  tree: TranslationTree,
  prefix: string,
  target: Record<string, string> = {}
): Record<string, string> => {
  Object.entries(tree).forEach(([key, value]) => {
    const nextPath = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      target[nextPath] = value;
      return;
    }
    if (value && typeof value === "object") {
      flattenTranslations(value, nextPath, target);
    }
  });
  return target;
};

const FLAT_TRANSLATIONS: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(RAW_TRANSLATIONS).map(([language, tree]) => [
    language,
    flattenTranslations(tree, INTEGRATION_PREFIX)
  ])
);

const resolveLanguageCandidates = (language?: string): string[] => {
  if (!language) {
    return ["en"];
  }
  const normalized = language.toLowerCase();
  const candidates = [normalized];
  if (normalized.includes("-")) {
    const base = normalized.split("-")[0];
    if (!candidates.includes(base)) {
      candidates.push(base);
    }
  }
  if (!candidates.includes("en")) {
    candidates.push("en");
  }
  return candidates;
};

export const getUiTranslations = (language?: string): Record<string, string> => {
  const candidates = resolveLanguageCandidates(language);
  const translations: Record<string, string> = {};

  [...candidates].reverse().forEach((code) => {
    const resources = FLAT_TRANSLATIONS[code];
    if (resources) {
      Object.assign(translations, resources);
    }
  });

  return translations;
};
