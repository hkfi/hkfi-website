import { Client } from '@notionhq/client'
import type { BlockObjectResponse, BulletedListItemBlockObjectResponse, ColumnBlockObjectResponse, ColumnListBlockObjectResponse, ListBlockChildrenParameters, MultiSelectPropertyItemObjectResponse, NumberedListItemBlockObjectResponse, PageObjectResponse, PartialBlockObjectResponse, QueryDatabaseParameters, TableBlockObjectResponse, TableRowBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { NOTION_DATABASE_ID, NOTION_INTEGRATION_TOKEN } from '@/constants/env'
import { NUMBER_OF_POSTS_PER_PAGE } from '@/constants/index'
import { getPostExcerpt, getReadingTime, getPostGradient, getFullPostText } from '@/libs/helpers/blog'
import { OPENAI_API_KEY } from '@/constants/env'
import OpenAI from 'openai'
import pLimit from 'p-limit'

export type CustomTableBlockObjectResponse = TableBlockObjectResponse & {
  table: {
    rows: TableRowBlockObjectResponse[]
  }
}
export type CustomColumnListBlockObjectResponse = ColumnListBlockObjectResponse & {
  column_list: {
    columns: ColumnBlockObjectResponse[]
  }
}
export type CustomBulletedListItemBlockObjectResponse = BulletedListItemBlockObjectResponse & {
  bulleted_list_item: {
    children?: BulletedListItemBlockObjectResponse[]
  }
}
export type CustomNumberedListItemBlockObjectResponse = NumberedListItemBlockObjectResponse & {
  numbered_list_item: {
    children: NumberedListItemBlockObjectResponse[]
  }
}

export type CustomBlockObjectResponse = BlockObjectResponse | CustomTableBlockObjectResponse | CustomColumnListBlockObjectResponse | CustomBulletedListItemBlockObjectResponse | CustomNumberedListItemBlockObjectResponse

const client = new Client({
  auth: NOTION_INTEGRATION_TOKEN,
})

let allPostsCache: PageObjectResponse[] | null = null

let allTagsCache: MultiSelectPropertyItemObjectResponse['multi_select'] | null = null

function isValidPageObject(pageObject: PageObjectResponse): boolean {
  const prop = pageObject.properties
  return (
    'title' in prop.Title && prop.Title.title.length > 0 &&
    'rich_text' in prop.Slug && prop.Slug.rich_text.length > 0 &&
    'date' in prop.Date
  )
}


function isBlockObjectResponse(block: (BlockObjectResponse | PartialBlockObjectResponse)): block is BlockObjectResponse {
  return 'type' in block
}

export async function getAllPosts() {
  if (allPostsCache !== null) {
    return allPostsCache
  }

  // Parameters to query Notion Posts Database
  const params: QueryDatabaseParameters = {
    database_id: NOTION_DATABASE_ID,
    filter: {
      and: [
        {
          property: 'Published',
          checkbox: {
            equals: true,
          },
        },
        {
          property: 'Date',
          date: {
            on_or_before: new Date().toISOString(),
          },
        },
      ],
    },
    sorts: [
      {
        property: 'Date',
        direction: 'descending',
      },
    ],
    page_size: 100,
  }

  let results: PageObjectResponse[] = []

  // Keep querying until there are no more pages
  while (true) {

    const res = await client.databases.query(params)

    results = results.concat(res.results as PageObjectResponse[])

    if (!res.has_more || !res.next_cursor) {
      break
    }

    params['start_cursor'] = res.next_cursor
  }

  allPostsCache = results
    .filter(pageObject => isValidPageObject(pageObject))

  return allPostsCache
}

export async function getPosts(pageSize = 10) {
  const allPosts = await getAllPosts()
  return allPosts.slice(0, pageSize)
}

// page starts from 1 not 0
export async function getPostsByPage(page: number) {
  if (page < 1) {
    return []
  }

  const allPosts = await getAllPosts()

  const startIndex = (page - 1) * NUMBER_OF_POSTS_PER_PAGE
  const endIndex = startIndex + NUMBER_OF_POSTS_PER_PAGE

  return allPosts.slice(startIndex, endIndex)
}

export async function getPostBySlug(slug: string): Promise<PageObjectResponse | null> {
  const allPosts = await getAllPosts()

  return allPosts.find(post => {
    const properties = post.properties
    const a = 'rich_text' in properties.Slug ? properties.Slug.rich_text[0].plain_text : ''
    return a === slug
  }) ?? null
}

// Only called when we know the block is a table
async function getTableRows(blockId: string): Promise<TableRowBlockObjectResponse[]> {
  let results: TableRowBlockObjectResponse[] = []

  const params: ListBlockChildrenParameters = {
    block_id: blockId,
  }

  while (true) {

    const res = await client.blocks.children.list(params)

    results = results.concat(res.results as TableRowBlockObjectResponse[])

    if (!res.has_more) {
      break
    }

    params['start_cursor'] = res.next_cursor as string
  }


  return results
}



export async function getAllBlocksByBlockId(blockId: string) {
  let results: Array<BlockObjectResponse> = []


  const params: ListBlockChildrenParameters = {
    block_id: blockId,
  }

  while (true) {
    const res = await client.blocks.children.list(params)

    const blockObjectReponses = res.results.filter((block) => isBlockObjectResponse(block)) as BlockObjectResponse[]

    results = results.concat(blockObjectReponses)

    if (!res.has_more) {
      break
    }

    params['start_cursor'] = res.next_cursor as string
  }

  const allBlocks: Array<BlockObjectResponse | CustomBlockObjectResponse> = results

  for (let i = 0; i < allBlocks.length; i++) {
    const block = allBlocks[i]

    if (!('type' in block)) {
      continue
    }

    if (block.type === 'table' && block.table) {
      (block as CustomTableBlockObjectResponse).table.rows = await getTableRows(block.id)
    } else if (block.type === 'bulleted_list_item' && block.bulleted_list_item && block.has_children) {
      block.bulleted_list_item.children = await getAllBlocksByBlockId(block.id)
    }

  }

  return allBlocks
}

export async function getAllTags() {
  if (allTagsCache !== null) {
    return allTagsCache
  }

  const allPosts = await getAllPosts()

  const tags = [...new Map((allPosts.flatMap(post => 'Tags' in post.properties && 'multi_select' in post.properties.Tags ? post.properties.Tags.multi_select : [])).map(item => [item.id, item])).values()]

  allTagsCache = tags

  return tags
}

// --- Card data for improved blog post cards ---

export type CardData = {
  excerpt: string
  readingTime: string
  coverUrl: string | null
  gradient: string
}

let cardDataCache: Map<string, CardData> | null = null

function getCoverUrl(post: PageObjectResponse): string | null {
  if (!post.cover) return null
  if (post.cover.type === 'external') return post.cover.external.url
  if (post.cover.type === 'file') return post.cover.file.url
  return null
}

function getPostTitle(post: PageObjectResponse): string {
  return 'title' in post.properties.Title && post.properties.Title.title[0]
    ? post.properties.Title.title[0].plain_text
    : ''
}

export async function getAllPostCardData(): Promise<Map<string, CardData>> {
  if (cardDataCache !== null) {
    return cardDataCache
  }

  const allPosts = await getAllPosts()
  const cardDataMap = new Map<string, CardData>()

  // Limit concurrency to avoid hitting Notion API rate limits (3 req/s)
  const limit = pLimit(3)
  const results = await Promise.all(
    allPosts.map((post) => limit(async () => {
      const blocks = await getAllBlocksByBlockId(post.id)
      const title = getPostTitle(post)
      return {
        id: post.id,
        cardData: {
          excerpt: getPostExcerpt(blocks as BlockObjectResponse[], 140),
          readingTime: getReadingTime(blocks as BlockObjectResponse[]),
          coverUrl: getCoverUrl(post),
          gradient: getPostGradient(title),
        }
      }
    }))
  )

  for (const { id, cardData } of results) {
    cardDataMap.set(id, cardData)
  }

  cardDataCache = cardDataMap
  return cardDataCache
}

// --- Embedding generation for semantic search ---

export type PostEmbedding = {
  slug: string
  title: string
  embedding: number[]
}

let embeddingsCache: PostEmbedding[] | null = null

function getPostTags(post: PageObjectResponse): string[] {
  return 'Tags' in post.properties && 'multi_select' in post.properties.Tags
    ? post.properties.Tags.multi_select.map((t) => t.name)
    : []
}

function getPostSlug(post: PageObjectResponse): string {
  return 'rich_text' in post.properties.Slug
    ? post.properties.Slug.rich_text[0].plain_text
    : ''
}

export async function generatePostEmbeddings(): Promise<PostEmbedding[]> {
  if (embeddingsCache !== null) {
    return embeddingsCache
  }

  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set, skipping embedding generation')
    return []
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
  const allPosts = await getAllPosts()

  // Fetch blocks for all posts with concurrency limit
  const limit = pLimit(3)
  const postsWithBlocks = await Promise.all(
    allPosts.map((post) => limit(async () => {
      const blocks = await getAllBlocksByBlockId(post.id)
      return { post, blocks: blocks as BlockObjectResponse[] }
    }))
  )

  // Generate embeddings with concurrency limit for OpenAI API
  const embeddingLimit = pLimit(5)
  const results = await Promise.all(
    postsWithBlocks.map(({ post, blocks }) => embeddingLimit(async () => {
      const title = getPostTitle(post)
      const tags = getPostTags(post)
      const fullText = getFullPostText(blocks)
      const input = `${title} ${tags.join(' ')} ${fullText}`.slice(0, 8000)

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input,
        dimensions: 256,
      })

      return {
        slug: getPostSlug(post),
        title,
        embedding: response.data[0].embedding,
      }
    }))
  )

  embeddingsCache = results
  return embeddingsCache
}