# Agent Instructions

## Local previews in Codex worktrees

When running this repo from a Codex worktree, reuse the environment file from the main checkout instead of creating or copying a local `.env`.

Main checkout env path:

```sh
/Users/hirokifuruichi/code/hkfi-website/.env
```

Use it by sourcing the file for the command that needs it:

```sh
set -a; source /Users/hirokifuruichi/code/hkfi-website/.env; set +a; pnpm dev --host 127.0.0.1
```

For builds:

```sh
set -a; source /Users/hirokifuruichi/code/hkfi-website/.env; set +a; pnpm build
```

Do not print secrets, commit `.env` files, or copy the main `.env` into the worktree.
