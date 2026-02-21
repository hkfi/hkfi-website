import type { APIContext } from 'astro'
import { generatePostEmbeddings } from '@/libs/notion/client'

export async function GET(_context: APIContext) {
  const embeddings = await generatePostEmbeddings()

  return new Response(JSON.stringify(embeddings), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
