# Pixe: build brief (approved by the owner 2026-10-19)

Read `D:\Code\AIPro\AIPro\ew-apps\CLAUDE.md` first, plus the saved memory on EW apps infrastructure and TaskPilot lessons. They all apply. **Reuse TaskPilot's shared pieces** (Vite starter setup, AI-connect layer, Meet-the-developer page, CI, deploy setup) by copying them from `../taskpilot`, not rebuilding them. Add Pixe's routes to `../ew-apps-api`; only one session writes there at a time, so check nobody else is working in it. Work on a new branch `revamp` from master, commit in small steps, push, and open a PR to master. Replace the CRA app entirely; keep git history.

**Key pivot:** Unsplash's API guidelines say "You cannot replicate the core user experience of Unsplash." So Pixe is **not** a photo search app. It is an AI moodboard and creative-direction tool that uses stock photos as raw material.

## 1. What's there now

- React 17 CRA, class components. Unsplash search returns 30 results in a masonry grid; clicking opens the photo in a new tab. A slide-out "Developer" panel has email copy and social links.
- Problems:
  - **Hard-coded Unsplash key** in `src/Components/api/unsplash.js`. It's public on GitHub; the owner will rotate it. Never commit keys.
  - `alt={discription}` is misspelled, so every image has no alt text.
  - The search input forces uppercase.
  - The menu is driven by `getElementById` style changes; copying uses the deprecated `execCommand('copy')`; `'__blank'` should be `'_blank'`.
  - No Unsplash or photographer credit and no download tracking (both required).
- Keep: the masonry feel, and the developer panel idea, which becomes the proper Meet-the-developer page.

## 2. What we're making

**Pixe: AI moodboards for creative direction.** Describe a vibe (e.g. "cozy autumn café brand, film grain, warm") and Pixe builds a board from several photo sources, extracts a palette, suggests font pairings, writes the creative brief, and exports or shares it.

Pages:

- `/`: landing with a 3D hero (photo cards flying into a floating 3D board, their colours bleeding into a palette strip), scroll story _describe → curate → extract → share_, pricing teaser, footer "Made with ♥ by EWSTUDIOS".
- `/app`: boards dashboard.
- `/app/board/:id`: infinite canvas. Drag, resize and group images, notes, colour swatches and font cards. A search drawer searches Unsplash, Pexels and Openverse at once.
- `/app/discover`: search with AI-rewritten queries, filters (orientation, colour, licence), "more like this".
- `/app/palette`: drop an image to get its palette, harmony suggestions and WCAG contrast checks; export as CSS variables, Tailwind config or Figma tokens.
- `/b/:shareId`: read-only shared board (Pro).
- `/developer`, `/pro`, `/settings`, `/privacy`, `/terms`, a designed 404.

## 3. Taken from competitors

| From                  | Feature                           | In Pixe                                                                           |
| --------------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| Pinterest             | Boards, "more like this"          | Boards; "more like this" = AI describes the image, then searches for similar ones |
| Milanote / Are.na     | Freeform visual canvas            | Infinite board with notes, groups and links                                       |
| Coolors / Adobe Color | Palettes and contrast             | Palette page: extraction, harmonies, WCAG checks, token export                    |
| Canva / Figma         | Brand kit                         | Brand-kit export: palette + font pairing + sample images as PDF/PNG (Pro)         |
| Eagle                 | Tagging and organising references | AI auto-tags and search inside your boards                                        |
| Freepik / Adobe Stock | Search by idea                    | Natural-language query → AI-expanded keyword sets per source                      |

**AI actions** (shared route `/api/ai/pixe/:action`): vibe → queries, describe image (alt text, tags, "more like this"), board → creative brief, palette → font pairing (Google Fonts only).
**On the device, no AI:** palette extraction (node-vibrant) and contrast maths, so they never use the shared quota.

## 4. Rules (required)

- **Unsplash:** use the image URLs it returns (no re-hosting); call `photo.links.download_location` on export or download; credit "Photo by X on Unsplash" with UTM links; keep the key in `ew-apps-api` (new `/api/photos/*` routes with caching); never build an Unsplash clone.
- **Pexels:** 200 requests/hour and 20,000/month by default; a prominent link to Pexels plus photographer credit; no competing stock service.
- **Openverse:** show each image's licence. Check the official docs for key and rate-limit rules before building.
- Every image card shows its source, photographer and real alt text (AI description, falling back to the source's own alt).
- Free-tier Gemini may be read by Google. Send only public stock photo URLs and the user's vibe text, never uploads.

## 5. Tech (all in)

- Same base as TaskPilot: React 19, strict TS, Vite, TanStack Router, Dexie, Zustand, Tailwind v4, shadcn/Radix, Motion, GSAP + Lenis, React Three Fiber + drei, PWA, CI with Lighthouse ≥ 95 and axe.
- Canvas: tldraw if its licence allows a free open-source app, otherwise react-konva. Keyboard operable, with an accessible list view of each board.
- Images: native lazy loading with blur placeholders; a virtualised masonry grid for long results.
- Export: html-to-image (PNG), jsPDF (brand kit).
- Tests: unit tests for merging results across sources, building credit lines and the contrast maths; Playwright for vibe → board → palette export.

## 6. Pro (gated through the shared entitlement)

Shared board links, brand-kit PDF export, board sync across devices, higher AI quota.

## 7. Design and assets

- Use the `awwwards` MCP for 3–5 references (moodboard tools, creative studios, 3D galleries) and write docs/design-brief.md. Show the owner the direction before building the UI.
- Google Flow (project "Revamp"), one session at a time in the owner's Chrome. The owner's character appears **only** on the developer page. Assets:
  - hero clip and still (photo cards forming a 3D board)
  - an illustration for each step (describe, curate, extract, share)
  - 4 empty-state illustrations
  - OG image
- The app's example boards use real stock photos through the APIs, credited; never AI images passed off as stock.
- List assets in docs/assets.md. Delete downloaded originals after use. Draw the logo and icons as SVG.

## Done means

- All pages work and tests pass in CI.
- docs/design-brief.md and docs/assets.md exist.
- A showcase README (see CLAUDE.md) uses real screenshots.
- A PR is open.
- After the owner approves, deploy to Cloudflare Pages like TaskPilot.

Ask the owner for the new Unsplash and Pexels keys (they put them in `ew-apps-api/.env` themselves). Don't deploy, rename the repo or spend anything without asking.
