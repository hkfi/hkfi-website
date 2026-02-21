import type { APIContext } from 'astro'
import OpenAI from 'openai'
import { OPENAI_API_KEY } from '@/constants/env'

export const prerender = false

// Simple in-memory rate limiting (per serverless instance)
const rateLimit = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

const ALLOWED_ORIGINS = ['https://hkfi.dev', 'http://localhost:4321', 'http://localhost:3000']

export async function POST(context: APIContext) {
  // Origin check
  const origin = context.request.headers.get('origin')
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Rate limit by IP
  const ip = context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    })
  }

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
