import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Slug is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const posthogApiKey = import.meta.env.POSTHOG_PROJECT_API_KEY
  const posthogProjectId = import.meta.env.POSTHOG_PROJECT_ID

  if (!posthogApiKey || !posthogProjectId) {
    console.error('PostHog environment variables are missing')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    const response = await fetch(
      `https://us.i.posthog.com/api/projects/${posthogProjectId}/query/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${posthogApiKey}`
        },
        body: JSON.stringify({
          query: {
            kind: 'TrendsQuery',
            series: [
              {
                kind: 'EventsNode',
                event: '$pageview',
                math: 'total'
              }
            ],
            properties: [
              {
                key: '$pathname',
                value: `/blog/post/${slug}`,
                operator: 'exact',
                type: 'event'
              }
            ],
            dateRange: {
              date_from: 'all'
            }
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('PostHog API Error:', errorText)
      return new Response(JSON.stringify({ error: 'Failed to fetch views' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()

    // The result shape from TrendsQuery contains an array of data points
    let count = 0
    if (data.results && data.results[0] && Array.isArray(data.results[0].data)) {
      count = data.results[0].data.reduce((sum: number, val: number) => sum + val, 0)
    }

    return new Response(JSON.stringify({ views: count }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })
  } catch (error) {
    console.error('Error fetching views from PostHog:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
