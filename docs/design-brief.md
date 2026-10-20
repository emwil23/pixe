# Pixe design brief

Made with the `awwwards` MCP (`search_sites`, `get_site_details`, `create_design_brief`) on 2026-10-19. We take ideas from these sites; we copy none of them.

## References

| Site                                          | Award            | What we take                                                                                                                                         |
| --------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [The Lookback](https://tlb.betteroff.studio/) | SOTD + Developer | A studio's references laid out as loose prints along a ruler. Our board canvas gets a tick-mark ruler and prints sitting at slightly uneven heights. |
| [WINDOWS](https://wndws.space)                | Honorable        | A calm grid of small photo slots on grey, some empty. This becomes the dashboard: each board is a contact sheet, empty slots shown as outlines.      |
| [OFFFForum](https://www.offforum.com/)        | SOTD             | Very quiet black chrome that lets a wall of mixed images carry all the colour; tiny uppercase nav.                                                   |
| [KINORIA](https://kinoria.studio/)            | Nominee          | A warm darkroom mood: prints with white borders on a dark desk, mono spec lines ("35MM / NO BATTERY"), one green accent.                             |

## The idea: a light table in a darkroom

Pixe's UI is the dark desk; the photos are the only colour. Images sit as **prints** (thin warm-white border, soft shadow) on a near-black, warm surface. The one UI accent is an acid **loupe green**, the colour of a light-table marker, used for focus, the primary button and the selection box. Everything Pixe learns from your photos (palette, fonts, brief) shows up as **swatch chips and spec lines** in mono type, like notes on a contact sheet.

This is deliberately not a stock-photo site: there's no search-results homepage, no "trending", no photographer feed. Search lives in a drawer on the board; the board is the product.

## Palette

The interface stays neutral so the extracted palettes read true.

Dark (default):

| Token       | Hex       | Use                                                                            |
| ----------- | --------- | ------------------------------------------------------------------------------ |
| `--bg`      | `#0E0D0C` | the desk (warm black)                                                          |
| `--surface` | `#181614` | panels, drawers                                                                |
| `--line`    | `#2A2723` | ruler ticks, borders                                                           |
| `--print`   | `#F4F0E8` | print borders, sticky notes                                                    |
| `--text`    | `#EDE8DF` | body text (15.9:1 on bg)                                                       |
| `--muted`   | `#A39C91` | secondary text (7.1:1 on bg, 6.6:1 on surface)                                 |
| `--accent`  | `#D4FF3A` | loupe green: primary buttons (dark text on it, 16.8:1), focus rings, selection |
| `--warn`    | `#FF5A36` | failed contrast checks, delete (6.3:1 on bg)                                   |

Light ("daylight"): `--bg #F2EEE6` (paper), `--surface #FFFFFF`, `--text #1A1816` (15.3:1), `--muted #5E574D` (6.2:1), `--accent #4A6400` (5.8:1, for text and rings; buttons keep the lime fill with dark text), `--warn #C2381A` (4.7:1).

## Type

- Display: **Instrument Serif** (with its italic) for big headlines and board titles: editorial, a creative-director voice.
- UI and body: **Inter Tight** variable.
- Spec lines: **JetBrains Mono**, uppercase 11px with wide tracking, for hex codes, photo credits, source badges, shortcuts ("UNSPLASH / 4000×6000 / PHOTO BY …").
- Self-hosted with `@fontsource`, so no font requests leave the site.

## Motion

- **Hero (R3F + drei):** about 14 prints float in a loose cloud, then fly into a tilted floating board as you scroll; as they land, a palette strip of five swatches extrudes out of the board, each swatch rising from the print it came from. The pointer tilts the board a little. On phones, software GPUs or reduced motion it's the generated still instead.
- **Scroll story (GSAP ScrollTrigger + Lenis):** one pinned section, four beats: _describe_ (a vibe is typed, letter by letter) → _curate_ (prints drop onto the board) → _extract_ (swatches and a font card peel off) → _share_ (the board folds into a link card). Each beat has its Flow illustration and short copy.
- **App (Motion):** prints scale in 160ms ease-out when added; drag uses a slight lift (shadow grows, 1.5° tilt). No scroll-jacking in the app.
- **Details:** a tick-mark ruler along the board's top and left edges that shows the zoom level, `+` registration marks at board corners, and mono spec lines under each print.
- `prefers-reduced-motion`: no Lenis, no scrub, no float or tilt; same content and keyboard access.

## Layout

- **Landing:** full-bleed hero → pinned four-beat story → "what Pixe pulls out of a board" bento (palette, fonts, brief, contrast) → sources and credits strip (Unsplash, Pexels, Openverse, credited properly) → pricing teaser → developer card → footer "Made with ♥ by EWSTUDIOS".
- **Dashboard `/app`:** boards as contact sheets: each card shows a 3×2 grid of the board's prints, its palette strip and title in serif. "New board" asks for a vibe.
- **Board `/app/board/:id`:** canvas fills the screen; a slim top bar (title, zoom, share, export, list-view toggle); a search drawer on the right (all three sources, tabs per source); an inspector on the left for the selected item (credit, alt text, "more like this", palette). On mobile, the drawers become bottom sheets and the canvas pans with two fingers.
- **Discover, Palette:** the same desk; Palette is a drop zone with the swatches as tall print-like strips and a contrast grid below.
- **404:** an empty light table with one print face-down; "This frame didn't develop."
