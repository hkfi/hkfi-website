# Personal Website/Blog

Built with Astro, Tailwind, Notion API, shiki, katex.
Blog is built with data from a Notion database fetched with Notion's API, and the page is recreated with component blocks that are available.

To run locally, make sure you have a Notion database with the properties:

1. Tags - multi-select
2. Date - date
3. Published - checkbox
4. Slug - text

Then provide the following environment variables in a .env.

```
NOTION_INTEGRATION_TOKEN=
NOTION_DATABASE_ID=
NOTION_TOKEN_V2=
NOTION_USER_ID=
```

Run it locally:

```
pnpm dev
```
