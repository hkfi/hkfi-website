# Agent Instructions

## Local previews in Codex worktrees

When running this repo from a Codex worktree, reuse the environment file from the main checkout instead of creating or copying a local `.env`.

Main checkout env path:

```sh
$HOME/code/hkfi-website/.env
```

Use it by sourcing the file for the command that needs it:

```sh
set -a; source "$HOME/code/hkfi-website/.env"; set +a; pnpm dev --host 127.0.0.1
```

For builds:

```sh
set -a; source "$HOME/code/hkfi-website/.env"; set +a; pnpm build
```

Do not print secrets, commit `.env` files, or copy the main `.env` into the worktree.

## Project commands

This is an Astro site using pnpm. Common commands:

```sh
pnpm dev --host 127.0.0.1
pnpm build
pnpm preview --host 127.0.0.1
pnpm lint
```

`pnpm lint` runs Prettier with `--write` and ESLint with `--fix`, so expect it to modify files.

For CI-style validation that does not rewrite source files, use the commands from `.github/workflows/ci.yml`:

```sh
pnpm exec prettier --check "**/*.{js,jsx,ts,tsx,md,mdx,astro}"
pnpm exec eslint "src/**/*.{js,ts,jsx,tsx,astro}"
pnpm build
```

The build fetches published blog and project content from Notion. `NOTION_INTEGRATION_TOKEN` and `NOTION_DATABASE_ID` are required for posts; `NOTION_PROJECTS_DATABASE_ID` enables project pages when present. `OPENAI_API_KEY` is used for embedding generation and related API routes, and missing it skips build-time embedding generation. Blog view counts and the production analytics snippet use PostHog env vars such as `POSTHOG_PROJECT_API_KEY`, `POSTHOG_PROJECT_ID`, and `PUBLIC_POSTHOG_PROJECT_API_KEY`.

## Production smoke checks

When running production QA against `https://hkfi.dev/`, record findings under `docs/qa/production-smoke-YYYY-MM-DD.md`. Cover core English and Japanese routes, representative project and blog detail pages, the command palette search, a synthetic 404, and browser console errors during navigation. If automated HTTP checks are blocked, note the limitation and complete the pass manually in a browser.

## Astro view transitions

Navbar UI persists across Astro route changes with `transition:persist`. For browser-side behavior that must survive route swaps, use a rerunnable inline script (`data-astro-rerun`) with a small window-level guard, delegated document listeners, and cleanup/reset hooks on Astro lifecycle events such as `astro:before-swap`, `astro:after-swap`, or `astro:page-load`.

## Translation helper

Use the Notion-backed translation helper to inspect or export post content for locale JSON files:

```sh
set -a; source "$HOME/code/hkfi-website/.env"; set +a; npx tsx scripts/translate.ts --list
set -a; source "$HOME/code/hkfi-website/.env"; set +a; npx tsx scripts/translate.ts --stale
set -a; source "$HOME/code/hkfi-website/.env"; set +a; npx tsx scripts/translate.ts --slug <slug>
```

The helper reads `NOTION_INTEGRATION_TOKEN` and `NOTION_DATABASE_ID`; pass `--db <id>` to override the database for a run. Save translated output under `src/i18n/content/{locale}/posts/{slug}.json`.
