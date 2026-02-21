import { Command } from 'cmdk'
import { useEffect, useState, useCallback, useRef } from 'react'

export interface CommandPaletteItem {
  title: string
  slug: string
  tags: string[]
}

interface CommandPaletteProps {
  posts: CommandPaletteItem[]
}

interface PostEmbedding {
  slug: string
  title: string
  embedding: number[]
}

interface SemanticResult {
  slug: string
  title: string
  score: number
}

const PAGES = [
  { title: 'Home', href: '/' },
  { title: 'About', href: '/about' },
  { title: 'Blog', href: '/blog/1' },
]

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

function PageIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' />
      <polyline points='9 22 9 12 15 12 15 22' />
    </svg>
  )
}

function PostIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' />
      <path d='M14 2v4a2 2 0 0 0 2 2h4' />
      <path d='M10 9H8' />
      <path d='M16 13H8' />
      <path d='M16 17H8' />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z' />
    </svg>
  )
}

export default function CommandPalette({ posts }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [semanticResults, setSemanticResults] = useState<SemanticResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const embeddingsRef = useRef<PostEmbedding[] | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Listen for custom event from the navbar trigger button
  useEffect(() => {
    const handleOpen = () => setOpen(true)
    document.addEventListener('open-command-palette', handleOpen)
    return () => document.removeEventListener('open-command-palette', handleOpen)
  }, [])

  // Clear semantic results when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch('')
      setSemanticResults([])
      setIsSearching(false)
    }
  }, [open])

  // Load embeddings lazily
  const loadEmbeddings = useCallback(async () => {
    if (embeddingsRef.current) return embeddingsRef.current
    try {
      const res = await fetch('/embeddings.json')
      if (!res.ok) return null
      const data: PostEmbedding[] = await res.json()
      embeddingsRef.current = data
      return data
    } catch {
      return null
    }
  }, [])

  // Semantic search effect
  useEffect(() => {
    if (!search || search.length < 2) {
      setSemanticResults([])
      setIsSearching(false)
      return
    }

    // Debounce
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      // Abort previous request
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIsSearching(true)

      try {
        const [embeddings, embedRes] = await Promise.all([
          loadEmbeddings(),
          fetch('/api/embed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: search }),
            signal: controller.signal,
          }),
        ])

        if (!embeddings || !embedRes.ok) {
          setIsSearching(false)
          return
        }

        const { embedding: queryEmbedding } = await embedRes.json()
        if (!queryEmbedding) {
          setIsSearching(false)
          return
        }

        // Compute cosine similarity for all posts
        const scored = embeddings
          .map((post) => ({
            slug: post.slug,
            title: post.title,
            score: cosineSimilarity(queryEmbedding, post.embedding),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)

        setSemanticResults(scored)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        // Silently fail — cmdk string matching still works
      } finally {
        if (!controller.signal.aborted) setIsSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, loadEmbeddings])

  const handleSelect = useCallback((href: string) => {
    setOpen(false)
    // Use Astro's navigate API for view transitions
    import('astro:transitions/client')
      .then(({ navigate }) => navigate(href))
      .catch(() => {
        // Fallback: programmatic anchor click for ClientRouter interception
        const a = document.createElement('a')
        a.href = href
        document.body.appendChild(a)
        a.click()
        a.remove()
      })
  }, [])

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label='Command Palette'>
      <Command.Input
        placeholder='Search pages and posts...'
        value={search}
        onValueChange={setSearch}
      />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>

        <Command.Group heading='Pages'>
          {PAGES.map((page) => (
            <Command.Item
              key={page.href}
              value={page.title}
              onSelect={() => handleSelect(page.href)}
            >
              <PageIcon />
              <span>{page.title}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading='Blog Posts'>
          {posts.map((post) => (
            <Command.Item
              key={post.slug}
              value={`${post.title} ${post.tags.join(' ')}`}
              onSelect={() => handleSelect(`/blog/post/${post.slug}`)}
            >
              <PostIcon />
              <span>{post.title}</span>
              {post.tags.length > 0 && (
                <span className='command-palette-tags'>
                  {post.tags.map((tag) => (
                    <span key={tag} className='command-palette-tag'>
                      {tag}
                    </span>
                  ))}
                </span>
              )}
            </Command.Item>
          ))}
        </Command.Group>

        {/* AI Semantic Search Results */}
        {(isSearching || semanticResults.length > 0) && (
          <Command.Group heading='AI Search'>
            {isSearching && semanticResults.length === 0 && (
              <div className='semantic-loading'>
                <span className='semantic-loading-dot' />
                <span className='semantic-loading-dot' />
                <span className='semantic-loading-dot' />
              </div>
            )}
            {semanticResults.map((result) => (
              <Command.Item
                key={`ai-${result.slug}`}
                value={`ai-semantic-${result.title}`}
                onSelect={() => handleSelect(`/blog/post/${result.slug}`)}
                forceMount
              >
                <SparkleIcon />
                <span>{result.title}</span>
                <span className='semantic-score'>
                  {Math.round(result.score * 100)}%
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  )
}
