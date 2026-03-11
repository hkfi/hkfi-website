export interface TranslatedRichText {
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
}

export interface TranslatedBlock {
  /** Notion block ID — matches the original block */
  id: string
  type: string
  richText: TranslatedRichText[]
}

export interface TranslatedPost {
  slug: string
  title: string
  excerpt: string
  blocks: TranslatedBlock[]
  /** ISO timestamp of Notion page's last_edited_time when translated */
  sourceLastEditedAt: string
  /** ISO timestamp when translation was generated */
  translatedAt: string
}

export interface TranslatedProject {
  slug: string
  name: string
  description: string
  blocks: TranslatedBlock[]
  sourceLastEditedAt: string
  translatedAt: string
}
