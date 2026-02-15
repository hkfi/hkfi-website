import { Command } from 'cmdk'
import { useEffect, useState, useCallback } from 'react'

export interface CommandPaletteItem {
  title: string
  slug: string
  tags: string[]
}

interface CommandPaletteProps {
  posts: CommandPaletteItem[]
}

const PAGES = [
  { title: 'Home', href: '/' },
  { title: 'About', href: '/about' },
  { title: 'Blog', href: '/blog/1' },
]

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

export default function CommandPalette({ posts }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)

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
      <Command.Input placeholder='Search pages and posts...' />
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
      </Command.List>
    </Command.Dialog>
  )
}
