import type { TranslationKey, Locale } from './types'
import en from './locales/en.json'
import ja from './locales/ja.json'

const translations: Record<Locale, Record<string, unknown>> = { en, ja }

export const LOCALES: Locale[] = ['en', 'ja']
export const DEFAULT_LOCALE: Locale = 'en'

/**
 * Get a translated string by dot-path key.
 * Supports simple {variable} interpolation.
 * Falls back to English if key is missing in target locale.
 */
export function t(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  let value: unknown = resolve(translations[locale], key)

  // Fallback to English
  if (value === undefined) {
    value = resolve(translations.en, key)
  }

  if (value === undefined) return key

  let result = String(value)
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(`{${k}}`, String(v))
    }
  }
  return result
}

function resolve(
  obj: Record<string, unknown>,
  path: string
): unknown {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return current
}

/**
 * Resolve locale from Astro.currentLocale or fallback to default.
 */
export function getLocale(astroCurrentLocale?: string): Locale {
  if (astroCurrentLocale && LOCALES.includes(astroCurrentLocale as Locale)) {
    return astroCurrentLocale as Locale
  }
  return DEFAULT_LOCALE
}

/**
 * Build a localized path. English paths have no prefix.
 */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (locale === DEFAULT_LOCALE) return clean
  return `/${locale}${clean}`
}

/**
 * Strip locale prefix from a pathname to get the base path.
 */
export function stripLocalePrefix(pathname: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return pathname
  const prefix = `/${locale}`
  if (pathname.startsWith(prefix)) {
    return pathname.slice(prefix.length) || '/'
  }
  return pathname
}

export type { TranslationKey, Locale }
