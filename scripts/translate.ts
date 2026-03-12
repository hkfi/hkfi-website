/**
 * Translation helper script.
 *
 * This script fetches content from Notion and outputs it in a structured format
 * suitable for translation by Claude Code. The translated output should be saved
 * as JSON files in src/i18n/content/{locale}/posts/{slug}.json.
 *
 * Usage (run within Claude Code session):
 *   npx tsx scripts/translate.ts --list              # List all posts and their translation status
 *   npx tsx scripts/translate.ts --slug my-post      # Output a specific post for translation
 *   npx tsx scripts/translate.ts --stale             # List posts that need re-translation
 *   npx tsx scripts/translate.ts --db <id> --stale   # Use a specific Notion database ID
 *
 * After running with --slug, Claude Code translates the output and saves the
 * JSON file. No API costs — uses the Claude Code subscription.
 */

import { Client } from '@notionhq/client'
import type {
  BlockObjectResponse,
  RichTextItemResponse
} from '@notionhq/client/build/src/api-endpoints'
import fs from 'node:fs'
import path from 'node:path'

// Load env and parse --db flag
const args = process.argv.slice(2)
const dbFlagIdx = args.indexOf('--db')
const NOTION_TOKEN = process.env.NOTION_INTEGRATION_TOKEN
const NOTION_DB_ID =
  dbFlagIdx !== -1 && args[dbFlagIdx + 1]
    ? args[dbFlagIdx + 1]
    : process.env.NOTION_DATABASE_ID

if (!NOTION_TOKEN || !NOTION_DB_ID) {
  console.error(
    'Missing NOTION_INTEGRATION_TOKEN or NOTION_DATABASE_ID.'
  )
  console.error(
    'Set them in .env, pass them as env vars, or use --db <id>.'
  )
  process.exit(1)
}

const notion = new Client({ auth: NOTION_TOKEN })

const CONTENT_DIR = path.join(process.cwd(), 'src/i18n/content')
const LOCALES = ['ja'] as const

interface PostMeta {
  slug: string
  title: string
  lastEditedTime: string
  id: string
}

interface TranslationStatus extends PostMeta {
  translated: boolean
  stale: boolean
  translatedAt?: string
}

async function getAllPosts(): Promise<PostMeta[]> {
  const results: PostMeta[] = []
  let cursor: string | undefined

  while (true) {
    const response = await notion.databases.query({
      database_id: NOTION_DB_ID!,
      start_cursor: cursor,
      filter: {
        and: [
          { property: 'Published', checkbox: { equals: true } },
          { property: 'Date', date: { on_or_before: new Date().toISOString() } }
        ]
      },
      sorts: [{ property: 'Date', direction: 'descending' }]
    })

    for (const page of response.results) {
      if (!('properties' in page)) continue

      const props = page.properties as Record<string, any>
      const title =
        props.Title?.title?.[0]?.plain_text ?? ''
      const slug =
        props.Slug?.rich_text?.[0]?.plain_text ?? ''

      if (slug) {
        results.push({
          slug,
          title,
          lastEditedTime: page.last_edited_time,
          id: page.id
        })
      }
    }

    if (!response.has_more) break
    cursor = response.next_cursor ?? undefined
  }

  return results
}

function getTranslationStatus(
  post: PostMeta,
  locale: string
): TranslationStatus {
  const filePath = path.join(CONTENT_DIR, locale, 'posts', `${post.slug}.json`)
  if (!fs.existsSync(filePath)) {
    return { ...post, translated: false, stale: false }
  }

  try {
    const translation = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const sourceTime = new Date(post.lastEditedTime).getTime()
    const translatedSourceTime = new Date(
      translation.sourceLastEditedAt
    ).getTime()

    return {
      ...post,
      translated: true,
      stale: sourceTime > translatedSourceTime,
      translatedAt: translation.translatedAt
    }
  } catch {
    console.warn(`Warning: Could not parse translation file for "${post.slug}", treating as untranslated.`)
    return { ...post, translated: false, stale: false }
  }
}

function serializeRichText(
  richTexts: RichTextItemResponse[]
): Array<{
  plainText: string
  annotations: {
    bold: boolean
    italic: boolean
    strikethrough: boolean
    underline: boolean
    code: boolean
    color: string
  }
  href: string | null
}> {
  return richTexts.map((rt) => ({
    plainText: rt.plain_text,
    annotations: {
      bold: rt.annotations.bold,
      italic: rt.annotations.italic,
      strikethrough: rt.annotations.strikethrough,
      underline: rt.annotations.underline,
      code: rt.annotations.code,
      color: rt.annotations.color
    },
    href: rt.href
  }))
}

function getRichTextFromBlock(
  block: BlockObjectResponse
): RichTextItemResponse[] | null {
  const type = block.type
  const data = (block as any)[type]
  if (data && 'rich_text' in data) {
    return data.rich_text as RichTextItemResponse[]
  }
  return null
}

const TRANSLATABLE_TYPES = new Set([
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'quote',
  'bulleted_list_item',
  'numbered_list_item',
  'callout',
  'toggle'
])

async function getBlocks(blockId: string): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = []
  let cursor: string | undefined

  while (true) {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100
    })

    for (const block of response.results) {
      if ('type' in block) {
        blocks.push(block as BlockObjectResponse)
      }
    }

    if (!response.has_more) break
    cursor = response.next_cursor ?? undefined
  }

  return blocks
}

async function outputPostForTranslation(slug: string) {
  const posts = await getAllPosts()
  const post = posts.find((p) => p.slug === slug)

  if (!post) {
    console.error(`Post with slug "${slug}" not found.`)
    process.exit(1)
  }

  const blocks = await getBlocks(post.id)

  // Extract translatable blocks
  const translatableBlocks = blocks
    .filter((b) => TRANSLATABLE_TYPES.has(b.type))
    .map((b) => {
      const richText = getRichTextFromBlock(b)
      if (!richText || richText.length === 0) return null
      return {
        id: b.id,
        type: b.type,
        richText: serializeRichText(richText)
      }
    })
    .filter(Boolean)

  // Extract excerpt from first paragraph
  const firstParagraph = blocks.find(
    (b) =>
      b.type === 'paragraph' &&
      (b as any).paragraph?.rich_text?.length > 0
  )
  const excerptText = firstParagraph
    ? ((firstParagraph as any).paragraph.rich_text as RichTextItemResponse[])
        .map((rt) => rt.plain_text)
        .join('')
        .slice(0, 140)
    : ''

  const output = {
    slug: post.slug,
    title: post.title,
    excerpt: excerptText,
    blocks: translatableBlocks,
    sourceLastEditedAt: post.lastEditedTime,
    _instructions:
      'Translate all plainText values from English to the target language. ' +
      'Preserve annotations, href, block IDs, and types exactly as-is. ' +
      'Do not translate code blocks, URLs, or technology names (TypeScript, React, etc.). ' +
      'Remove the _instructions field from the final output and add a translatedAt ISO timestamp.'
  }

  console.log(JSON.stringify(output, null, 2))
}

async function main() {
  if (args.includes('--list')) {
    const posts = await getAllPosts()
    console.log(`\nFound ${posts.length} published posts:\n`)

    for (const locale of LOCALES) {
      console.log(`--- ${locale.toUpperCase()} translations ---`)
      for (const post of posts) {
        const status = getTranslationStatus(post, locale)
        const icon = status.translated
          ? status.stale
            ? '🔄'
            : '✅'
          : '❌'
        console.log(`  ${icon} ${post.slug} — "${post.title}"`)
      }
      console.log()
    }
    return
  }

  if (args.includes('--stale')) {
    const posts = await getAllPosts()
    for (const locale of LOCALES) {
      console.log(`\n--- ${locale.toUpperCase()} stale/missing translations ---`)
      for (const post of posts) {
        const status = getTranslationStatus(post, locale)
        if (!status.translated || status.stale) {
          const reason = status.stale ? '(stale)' : '(missing)'
          console.log(`  ${post.slug} — "${post.title}" ${reason}`)
        }
      }
    }
    return
  }

  const slugIdx = args.indexOf('--slug')
  if (slugIdx !== -1 && args[slugIdx + 1]) {
    await outputPostForTranslation(args[slugIdx + 1])
    return
  }

  console.log(`
Usage:
  npx tsx scripts/translate.ts --list              List all posts and translation status
  npx tsx scripts/translate.ts --stale             Show posts needing translation
  npx tsx scripts/translate.ts --slug <slug>       Output a post for translation

Options:
  --db <id>       Override Notion database ID (defaults to NOTION_DATABASE_ID env var)
`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
