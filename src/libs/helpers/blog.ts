import type { BlockObjectResponse, Heading1BlockObjectResponse, Heading2BlockObjectResponse, Heading3BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints"

type HeadingBlockObjectResponse = Heading1BlockObjectResponse | Heading2BlockObjectResponse | Heading3BlockObjectResponse

export const buildHeadingId = (block: HeadingBlockObjectResponse) => {
  const heading = 'heading_1' in block ? block.heading_1 : 'heading_2' in block ? block.heading_2 : block.heading_3

  return heading.rich_text.map((richText) => {
    if (!('text' in richText)) {
      return ''
    }
    return richText.plain_text
  }).join('').trim()
}

/**
 * Extract plain text from a block's rich_text array.
 */
function extractBlockText(block: BlockObjectResponse): string {
  const richText =
    block.type === 'paragraph' ? block.paragraph.rich_text :
    block.type === 'heading_1' ? block.heading_1.rich_text :
    block.type === 'heading_2' ? block.heading_2.rich_text :
    block.type === 'heading_3' ? block.heading_3.rich_text :
    block.type === 'quote' ? block.quote.rich_text :
    block.type === 'bulleted_list_item' ? block.bulleted_list_item.rich_text :
    block.type === 'numbered_list_item' ? block.numbered_list_item.rich_text :
    block.type === 'code' ? block.code.rich_text :
    null

  if (!richText) return ''
  return richText.map((rt) => rt.plain_text).join('')
}

/**
 * Get the first meaningful paragraph as an excerpt for a blog post card.
 */
export function getPostExcerpt(blocks: BlockObjectResponse[], maxLength = 140): string {
  for (const block of blocks) {
    if (block.type === 'paragraph' && block.paragraph.rich_text.length > 0) {
      const text = block.paragraph.rich_text.map((rt) => rt.plain_text).join('').trim()
      if (text.length > 0) {
        if (text.length <= maxLength) return text
        return text.slice(0, maxLength).trimEnd() + '…'
      }
    }
  }
  return ''
}

/**
 * Calculate estimated reading time from all text-bearing blocks.
 * Uses 200 words per minute.
 */
export function getReadingTime(blocks: BlockObjectResponse[]): string {
  let wordCount = 0
  for (const block of blocks) {
    const text = extractBlockText(block)
    if (text) {
      wordCount += text.split(/\s+/).filter(Boolean).length
    }
  }
  const minutes = Math.max(1, Math.round(wordCount / 200))
  return `${minutes} min read`
}

/**
 * Generate a deterministic inline gradient style based on the post title.
 * Uses CSS custom properties so it works in both light and dark mode.
 * Returns an inline CSS `background` value (not Tailwind classes) to avoid purge issues.
 */
const GRADIENTS: [string, string][] = [
  ['var(--color-primary)', 'var(--color-secondary)'],
  ['var(--color-secondary)', 'var(--color-primary)'],
  ['var(--color-accent)', 'var(--color-primary)'],
  ['var(--color-primary)', 'var(--color-accent)'],
  ['var(--color-secondary)', 'var(--color-accent)'],
  ['var(--color-accent)', 'var(--color-secondary)'],
  ['var(--color-primary)', 'var(--color-muted)'],
  ['var(--color-muted)', 'var(--color-primary)'],
]

export function getPostGradient(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0
  }
  const index = Math.abs(hash) % GRADIENTS.length
  const [from, to] = GRADIENTS[index]
  return `linear-gradient(135deg, color-mix(in srgb, ${from} 30%, transparent) 0%, color-mix(in srgb, ${to} 50%, transparent) 100%)`
}
