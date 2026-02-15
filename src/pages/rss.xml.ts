import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getAllPosts } from '@/libs/notion/client'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

function getTitle(post: PageObjectResponse): string {
  const prop = post.properties.Title
  return 'title' in prop && prop.title[0] ? prop.title[0].plain_text : ''
}

function getSlug(post: PageObjectResponse): string {
  const prop = post.properties.Slug
  return 'rich_text' in prop && prop.rich_text[0]
    ? prop.rich_text[0].plain_text
    : ''
}

function getDate(post: PageObjectResponse): Date | undefined {
  const prop = post.properties.Date
  if ('date' in prop && prop.date?.start) {
    return new Date(prop.date.start)
  }
  return undefined
}

export async function GET(context: APIContext) {
  const posts = await getAllPosts()

  return rss({
    title: 'hkfi',
    description: "hkfi's tech blog",
    site: context.site!.toString(),
    items: posts.map((post) => ({
      title: getTitle(post),
      pubDate: getDate(post),
      link: `/blog/post/${getSlug(post)}`,
    })),
  })
}
