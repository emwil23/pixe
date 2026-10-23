# Pixe assets

All art was generated on 19 October 2026 in the owner's Google Flow project **"Revamp"**: stills with Nano Banana Pro, clips with Omni 1.1 Flash. The owner's master character appears **only** on the Meet the developer page and the landing page's developer card. Nothing here is passed off as stock: the app's boards use real Unsplash and Openverse photos, credited, and the landing page labels its art "Illustration · not a stock photo".

The logo, favicon, PWA icons and UI icons are SVG drawn in code (`src/components/Logo.tsx`, `public/favicon.svg`, Lucide). The PNG icons and `og.jpg` were rendered from HTML/SVG with headless Chromium.

Shared style for every still: _premium 3D render / editorial still life, warm darkroom lighting, deep warm-black background (#0E0D0C), soft film grain, acid lime (#D4FF3A) accents, no people (except the developer art), no text, no logos._

| File (`public/media/`)                                               | Size                      | Used on                                                                                               | Prompt (short)                                                                                           |
| -------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `hero.webp`                                                          | 1376×768                  | Landing hero (under the live 3D scene; the whole hero on phones and with reduced motion), clip poster | A dozen photo prints settle into a grid on a floating charcoal board; five swatch blocks rise below it.  |
| `hero.mp4`, `hero.webm`                                              | 1280×720, 8s loop, 0.6 MB | Landing, "The AI" section                                                                             | Start and end frame = the hero still; the prints lift off the board and settle back.                     |
| `tile-1.webp` … `tile-6.webp`                                        | 512×384                   | Textures on the 3D hero's cards                                                                       | Moody 35mm film photographs: latte art, autumn leaves, linen, sage plates, espresso steam, window light. |
| `step-describe.webp`                                                 | 720×720                   | Landing story, beat 1                                                                                 | Ink lifts off a paper card and forms empty floating frames.                                              |
| `step-curate.webp`                                                   | 720×720                   | Landing story, beat 2; credits section                                                                | Prints drop onto a dark light table in a loose grid.                                                     |
| `step-extract.webp`                                                  | 720×720                   | Landing story, beat 3                                                                                 | Swatch chips and a serif type card peel off a print.                                                     |
| `step-share.webp`                                                    | 720×720                   | Landing story, beat 4                                                                                 | A moodboard folds into a card; a lime chain link and a paper plane.                                      |
| `empty-boards.webp`                                                  | 480×480                   | Empty dashboard                                                                                       | An empty light table with six outlined slots and a lime loupe.                                           |
| `empty-board.webp`                                                   | 480×480                   | Missing board, shared-board page                                                                      | One print face down on an empty board, a lime push pin.                                                  |
| `empty-palette.webp`                                                 | 480×480                   | Palette page before an image is dropped                                                               | Blank paint sample cards and an eyedropper with a lime drop.                                             |
| `empty-search.webp`                                                  | 480×480                   | Discover with no search or no results                                                                 | A brass loupe glowing lime over scattered empty frames.                                                  |
| `developer.webp`                                                     | 720×960                   | Landing developer card                                                                                | **Owner's character**, waist-up, pinning a print to a moodboard wall, smiling.                           |
| `developer-loop.mp4`, `developer-loop.webm`, `developer-poster.webp` | 720×960, 6s loop, 0.4 MB  | Meet the developer                                                                                    | **Owner's character**; start and end frame = the portrait; he pins the print, looks, smiles and nods.    |
| `og.jpg`                                                             | 1200×630                  | Social share image                                                                                    | The hero still on the right, wordmark and tagline set in HTML.                                           |

## How they were optimised

- Flow marks each output with a small sparkle in the bottom-right corner; every still and clip is cropped from the top-left to leave it out.
- Stills: `ffmpeg` to WebP, quality 78 (tiles 72), resized to the sizes above.
- Clips: `ffmpeg`, H.264 CRF 27 (`+faststart`) and VP9 CRF 38, 30 fps, no audio. The developer poster is the clip's own first frame, so nothing jumps when it starts.
- Clips load with `preload="none"` and play only while on screen (`src/components/LoopVideo.tsx`), and never with reduced motion. The service worker doesn't precache them.
- Downloaded originals were deleted from `D:\Downloads` once these were in the repo.

## Fonts

Self-hosted in `public/fonts`, latin only: Instrument Serif (regular and italic), Inter Tight (variable) and JetBrains Mono. The mono face is only for small spec labels, so it is pinned to weight 400 and subset with fontTools (`fonttools varLib.instancer … wght=400`, then `pyftsubset` to ASCII, Latin-1 and a few punctuation marks), which takes it from 40 kB to 18 kB. All three are SIL Open Font License.
