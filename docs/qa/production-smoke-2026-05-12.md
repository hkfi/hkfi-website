# Production Smoke Check - 2026-05-12

- Checked: 2026-05-11 22:43 EDT / 2026-05-12 02:43 UTC
- Follow-up attempt: 2026-05-12 16:10 EDT / 2026-05-12 20:10 UTC
- Manual browser follow-up: 2026-05-12 22:25 EDT / 2026-05-13 02:25 UTC
- Production URL: https://hkfi.dev/
- Viewports: desktop Chrome browser window; earlier pass also covered desktop 1440x1200 and mobile 390x844

## Scope

- Reviewed repo standards: `AGENTS.md` and `.agent/rules/project.md` were present. Other requested standards files were not present in this checkout.
- Earlier pass visually checked core routes on desktop and mobile: `/`, `/projects`, `/about`, `/blog`, `/ja/`, and a synthetic missing URL.
- Earlier pass crawled rendered production links from core pages and discovered detail pages.
- 2026-05-12 22:25 EDT manual Chrome pass checked: `/`, `/projects`, all English project detail pages, `/about`, `/blog`, an English blog post, `/ja/`, `/ja/projects`, `/ja/blog`, a Japanese blog post, command palette search, and the Japanese project-detail 404s listed below.
- Checked 404 handling with `https://hkfi.dev/__production-smoke-check-missing-page` earlier and verified a Japanese project-detail 404 during the manual follow-up.
- Opened Chrome DevTools Console during the manual follow-up on `https://hkfi.dev/ja/blog/post/keyword-to-vector-search-sqlite` to capture console-visible issues.
- Limitation: CLI HTTP crawling and Vercel fetches were blocked because network/tool escalation was not approved in Codex. Manual Chrome navigation succeeded.

## Result

Production is broadly usable. Core English and Japanese landing routes render, navigation is present, English project detail pages return rendered project pages, and blog index/post surfaces render in both English and Japanese. No missing images or obvious desktop layout breakage were spotted during the manual pass.

Follow-up work remains for broken Japanese project detail links, duplicate 404 copy, and a View Transitions console error on blog post navigation.

## Route Checks

| Route                                           | Status | Desktop                       | Mobile               | Notes                                                                                         |
| ----------------------------------------------- | -----: | ----------------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `/`                                             |    200 | Pass                          | Pass in earlier pass | Home content, emoji/hero, and recent posts render.                                            |
| `/projects`                                     |    200 | Pass                          | Pass in earlier pass | Project cards render. English detail pages render.                                            |
| `/projects/daily-photos`                        |    200 | Pass                          | Not rechecked        | Project detail renders with live/source links.                                                |
| `/projects/shadow-clone`                        |    200 | Pass                          | Not rechecked        | Project detail renders with live link.                                                        |
| `/projects/hkfi-website`                        |    200 | Pass                          | Not rechecked        | Project detail renders with live/source links.                                                |
| `/projects/insight-notes`                       |    200 | Pass                          | Not rechecked        | Project detail renders with source link.                                                      |
| `/about`                                        |    200 | Pass                          | Pass in earlier pass | Profile and Lighthouse assets render.                                                         |
| `/blog`                                         |    200 | Pass                          | Pass in earlier pass | Blog tag filters and post cards render.                                                       |
| `/blog/post/keyword-to-vector-search-sqlite`    |    200 | Pass                          | Not rechecked        | Post content, code blocks, table, and TOC render.                                             |
| `/ja/`                                          |    200 | Pass                          | Pass in earlier pass | Japanese home and recent posts render.                                                        |
| `/ja/projects`                                  |    200 | Pass with broken detail links | Not rechecked        | Japanese project cards render but link to 404 detail pages.                                   |
| `/ja/blog`                                      |    200 | Pass                          | Not rechecked        | Japanese blog cards render.                                                                   |
| `/ja/blog/post/keyword-to-vector-search-sqlite` |    200 | Pass with console issue       | Not rechecked        | Japanese post content renders; console captured duplicate View Transition name.               |
| `/__production-smoke-check-missing-page`        |    404 | Pass with copy issue          | Pass with copy issue | Correct status, but copy has duplicate wording.                                               |
| `/ja/projects/{slug}`                           |    404 | Fail                          | Not rechecked        | All four Japanese project detail slugs below manually confirmed as 404 in the follow-up pass. |

## Navigation and Search

- Header navigation checked: home, projects, about, blog, and language switcher surfaces.
- Command palette opened from the search button on `/about` and filtered successfully for `sqlite`, showing matching blog post results.
- Blog tag filters are visible on English and Japanese blog indexes; no destructive or externally visible actions were taken.

## Console Notes

Captured in Chrome DevTools Console on `https://hkfi.dev/ja/blog/post/keyword-to-vector-search-sqlite`:

- First-party errors:
  - `Unexpected duplicate view-transition-name: tag-SQLite`
  - `Uncaught (in promise) InvalidStateError: Transition was aborted because of invalid state`
- Likely related cause: the post page renders the same tag link in more than one visible/transition-scoped location, producing duplicate View Transition names.
- Ignored as local browser-extension noise: repeated `checkSupportDomain domain: hkfi.dev` messages from a Chrome extension URL.
- Non-blocking observation to watch: one `THREE.WebGLRenderer: Context Lost.` message was present in the console history. It did not produce an obvious user-visible failure during this pass.

## Link Checks

- Navigation links checked manually: home, projects, about, blog, language switcher targets.
- Blog links checked manually in representative English and Japanese post flows; earlier pass checked all discovered English and Japanese blog post links returned `200`.
- Project links checked manually:
  - English project detail links render.
  - Japanese project detail links return `404`.
- External links checked by HTTP in earlier pass where possible:
  - `https://github.com/hkfi` -> `200`
  - `https://twitter.com/hkfidev` -> redirects to `https://x.com/hkfidev` with `200`
  - `https://github.com/hkfi/hkfi-website` -> `200`
  - `https://posthog.com/docs/libraries/astro` -> `200`
  - `https://github.com/hkfi/daily-photos-macos/releases` -> `200`
  - `https://github.com/hkfi/daily-photos-macos` -> `200`
  - `https://shadowcl.one/` -> `200`
  - `https://github.com/hkfi/insight-notes` -> `200`
  - `https://linkedin.com/in/hiroki-furuichi` returned LinkedIn `999` bot-protection to automated checks and still needs manual browser verification.

## Follow-Up Tickets

1. Fix broken Japanese project detail links.

   - `https://hkfi.dev/ja/projects/daily-photos`
   - `https://hkfi.dev/ja/projects/shadow-clone`
   - `https://hkfi.dev/ja/projects/hkfi-website`
   - `https://hkfi.dev/ja/projects/insight-notes`
   - Likely cause: `src/pages/ja/projects/[slug].astro` only builds slugs with project translation JSON, but `/ja/projects` renders project cards that link to Japanese detail URLs.

2. Fix duplicate 404 copy.

   - Current English text renders as: `Go back home or browse the blog blog.`
   - The template appends a linked `nav.blog` label after `error.orBrowseBlog`, which already includes `blog`.

3. Fix duplicate View Transition names on blog post tags.

   - Observed console error: `Unexpected duplicate view-transition-name: tag-SQLite`.
   - Follow-on error: `InvalidStateError: Transition was aborted because of invalid state`.
   - Start by checking duplicate transition-scoped tag links in blog post metadata layouts.

4. Manually verify the LinkedIn outbound profile link.

   - Automated checks received LinkedIn `999`, which is commonly bot protection rather than a confirmed broken link.

5. Watch for repeat `THREE.WebGLRenderer: Context Lost.` console messages.
   - Treat as low priority unless it reproduces with visible impact on the homepage emoji/3D surface or during post navigation.
