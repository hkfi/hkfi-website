import type { APIRoute } from 'astro'

export const prerender = false

const GITHUB_USERNAME = 'hkfi'
const TIMEZONE = 'America/New_York'
const GITHUB_API_VERSION = '2026-03-10'
const GITHUB_EVENTS_URL = `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100`

type GithubEvent = {
  type?: string
  created_at?: string
  repo?: {
    name?: string
  }
  payload?: {
    commits?: unknown[]
  }
}

type RepositorySummary = {
  name: string
  url: string
  eventCount: number
}

type TodayGithubActivity = {
  status: 'active' | 'quiet' | 'unavailable'
  date: string
  timezone: typeof TIMEZONE
  totals: {
    events: number
    commits: number
    repositories: number
    pullRequests: number
    issues: number
  }
  repositories: RepositorySummary[]
  generatedAt: string
}

function jsonResponse(data: TodayGithubActivity, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600'
    }
  })
}

function formatDateInTimezone(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  )

  return `${values.year}-${values.month}-${values.day}`
}

function createEmptyActivity(
  status: TodayGithubActivity['status'],
  date: string,
  generatedAt: string
): TodayGithubActivity {
  return {
    status,
    date,
    timezone: TIMEZONE,
    totals: {
      events: 0,
      commits: 0,
      repositories: 0,
      pullRequests: 0,
      issues: 0
    },
    repositories: [],
    generatedAt
  }
}

function summarizeEvents(
  events: GithubEvent[],
  date: string,
  generatedAt: string
): TodayGithubActivity {
  const repositoryCounts = new Map<string, number>()
  let commits = 0
  let pullRequests = 0
  let issues = 0

  for (const event of events) {
    const repoName = event.repo?.name
    if (repoName) {
      repositoryCounts.set(repoName, (repositoryCounts.get(repoName) ?? 0) + 1)
    }

    if (event.type === 'PushEvent') {
      const eventCommits = event.payload?.commits
      commits += Array.isArray(eventCommits) ? eventCommits.length : 0
    }

    if (event.type === 'PullRequestEvent') {
      pullRequests += 1
    }

    if (event.type === 'IssuesEvent') {
      issues += 1
    }
  }

  const repositories = [...repositoryCounts.entries()]
    .map(([name, eventCount]) => ({
      name,
      url: `https://github.com/${name}`,
      eventCount
    }))
    .sort((a, b) => b.eventCount - a.eventCount || a.name.localeCompare(b.name))
    .slice(0, 3)

  return {
    status: events.length > 0 ? 'active' : 'quiet',
    date,
    timezone: TIMEZONE,
    totals: {
      events: events.length,
      commits,
      repositories: repositoryCounts.size,
      pullRequests,
      issues
    },
    repositories,
    generatedAt
  }
}

export const GET: APIRoute = async () => {
  const now = new Date()
  const today = formatDateInTimezone(now, TIMEZONE)
  const generatedAt = now.toISOString()

  try {
    const response = await fetch(GITHUB_EVENTS_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': GITHUB_API_VERSION
      }
    })

    if (!response.ok) {
      console.error('GitHub activity API error:', response.status)
      return jsonResponse(
        createEmptyActivity('unavailable', today, generatedAt)
      )
    }

    const data: unknown = await response.json()
    if (!Array.isArray(data)) {
      console.error('GitHub activity API returned an unexpected shape')
      return jsonResponse(
        createEmptyActivity('unavailable', today, generatedAt)
      )
    }

    const todayEvents = data.filter((event): event is GithubEvent => {
      if (!event || typeof event !== 'object') return false

      const createdAt = (event as GithubEvent).created_at
      if (!createdAt) return false

      const eventDate = new Date(createdAt)
      if (Number.isNaN(eventDate.getTime())) return false

      return formatDateInTimezone(eventDate, TIMEZONE) === today
    })

    return jsonResponse(summarizeEvents(todayEvents, today, generatedAt))
  } catch (error) {
    console.error('Error fetching GitHub activity:', error)
    return jsonResponse(createEmptyActivity('unavailable', today, generatedAt))
  }
}
