import en from './ui/en.json';
import th from './ui/th.json';
import ms from './ui/ms.json';
import vi from './ui/vi.json';
import km from './ui/km.json';
import lo from './ui/lo.json';
import fil from './ui/fil.json';
import id from './ui/id.json';

export const locales = ['en', 'th', 'ms', 'vi', 'km', 'lo', 'fil', 'id'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

// Native names, shown in the language switcher.
export const localeNames: Record<Locale, string> = {
  en: 'English', th: 'ไทย', ms: 'Bahasa Melayu', vi: 'Tiếng Việt',
  km: 'ភាសាខ្មែរ', lo: 'ລາວ', fil: 'Filipino', id: 'Bahasa Indonesia',
};

type Dict = Record<string, any>;
const dictionaries: Record<Locale, Dict> = { en, th, ms, vi, km, lo, fil, id };

function merge(base: Dict, over: Dict): Dict {
  const out: Dict = Array.isArray(base) ? [...base] : { ...base };
  for (const [k, v] of Object.entries(over ?? {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof base?.[k] === 'object') {
      out[k] = merge(base[k], v);
    } else if (v !== undefined && v !== '') {
      out[k] = v; // empty strings fall back to English
    }
  }
  return out;
}

/** Full UI dictionary for a locale. Missing keys fall back to English. */
export function getUi(locale: Locale): Dict {
  return locale === 'en' ? en : merge(en, dictionaries[locale]);
}

/** Look up "a.b.c" in the dictionary, with {placeholders}. */
export function useTranslations(locale: Locale) {
  const ui = getUi(locale);
  return (key: string, vars: Record<string, string | number> = {}): string => {
    const value = key.split('.').reduce<any>((o, k) => o?.[k], ui);
    const text = typeof value === 'string' ? value : key;
    return text.replace(/\{(\w+)\}/g, (_, v) => String(vars[v] ?? `{${v}}`));
  };
}

/** Path for a page in a locale. English lives at the root, others under /xx/. */
export function localePath(locale: Locale, path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  return clean === '/' ? `/${locale}/` : `/${locale}${clean}`;
}

/** getStaticPaths helper: one entry per locale, English with no prefix. */
export function localeParams() {
  return locales.map((locale) => ({
    params: { lang: locale === defaultLocale ? undefined : locale },
    props: { locale },
  }));
}
