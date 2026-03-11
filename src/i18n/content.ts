import type { Locale } from './types'
import type { TranslatedPost, TranslatedProject } from './translation-types'
import fs from 'node:fs'
import path from 'node:path'

const CONTENT_DIR = path.join(process.cwd(), 'src/i18n/content')

export function hasTranslation(
  locale: Locale,
  type: 'posts' | 'projects',
  slug: string
): boolean {
  if (locale === 'en') return true
  const filePath = path.join(CONTENT_DIR, locale, type, `${slug}.json`)
  return fs.existsSync(filePath)
}

export function getTranslatedPost(
  locale: Locale,
  slug: string
): TranslatedPost | null {
  if (locale === 'en') return null
  const filePath = path.join(CONTENT_DIR, locale, 'posts', `${slug}.json`)
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    console.warn(`Warning: Could not parse translation file: ${filePath}`)
    return null
  }
}

export function getTranslatedProject(
  locale: Locale,
  slug: string
): TranslatedProject | null {
  if (locale === 'en') return null
  const filePath = path.join(CONTENT_DIR, locale, 'projects', `${slug}.json`)
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    console.warn(`Warning: Could not parse translation file: ${filePath}`)
    return null
  }
}

export function getAllTranslatedSlugs(
  locale: Locale,
  type: 'posts' | 'projects'
): string[] {
  if (locale === 'en') return []
  const dir = path.join(CONTENT_DIR, locale, type)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''))
}
