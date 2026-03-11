import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import type { TranslatedBlock } from './translation-types'

/** Block types that contain translatable rich_text */
const RICH_TEXT_BLOCK_TYPES: Record<string, true> = {
  paragraph: true,
  heading_1: true,
  heading_2: true,
  heading_3: true,
  quote: true,
  bulleted_list_item: true,
  numbered_list_item: true,
  callout: true,
  toggle: true
}

/**
 * Merge translated blocks back into the original Notion block structure.
 * Blocks without translations (code, images, etc.) pass through unchanged.
 * The result is a valid Notion block array that can be rendered by NotionBlocks.astro.
 */
export function mergeTranslatedBlocks(
  originalBlocks: BlockObjectResponse[],
  translatedBlocks: TranslatedBlock[]
): BlockObjectResponse[] {
  const translationMap = new Map(translatedBlocks.map((b) => [b.id, b]))

  return originalBlocks.map((block) => {
    const translated = translationMap.get(block.id)
    if (!translated || !RICH_TEXT_BLOCK_TYPES[block.type]) {
      return block
    }

    // Deep clone to avoid mutating the original
    const cloned = structuredClone(block) as Record<string, any>
    const blockData = cloned[block.type]

    if (blockData && 'rich_text' in blockData) {
      blockData.rich_text = translated.richText.map((rt) => ({
        type: 'text' as const,
        text: {
          content: rt.plainText,
          link: rt.href ? { url: rt.href } : null
        },
        annotations: rt.annotations,
        plain_text: rt.plainText,
        href: rt.href
      }))
    }

    return cloned as BlockObjectResponse
  })
}
