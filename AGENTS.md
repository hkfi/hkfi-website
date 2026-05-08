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

The build fetches published blog and project content from Notion. `NOTION_INTEGRATION_TOKEN` and `NOTION_DATABASE_ID` are required for posts; `NOTION_PROJECTS_DATABASE_ID` enables project pages when present. `OPENAI_API_KEY` is used for embedding generation and related API routes, and missing it skips build-time embedding generation.
