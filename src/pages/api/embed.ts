import type { APIContext } from 'astro'
import OpenAI from 'openai'
import { OPENAI_API_KEY } from '@/constants/env'

export const prerender = false

export async function POST(context: APIContext) {
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: { query?: string }
  try {
    body = await context.request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const query = body.query?.trim()
  if (!query || query.length === 0) {
    return new Response(JSON.stringify({ error: 'Query is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (query.length > 500) {
    return new Response(JSON.stringify({ error: 'Query too long (max 500 characters)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      dimensions: 256,
    })

    return new Response(JSON.stringify({ embedding: response.data[0].embedding }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('OpenAI embedding error:', err)
    return new Response(JSON.stringify({ error: 'Failed to generate embedding' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
