import { useAi } from '@/ai/useAi'
import { AiNotice } from '@/components/AiNotice'
import { Markdown } from '@/components/Markdown'
import { Button } from '@/components/ui/button'
import { addItem, altOf, touch } from '@/lib/board'
import type { Board, FontItem, Item, PhotoItem, SwatchItem } from '@/lib/db'
import { isFontName } from '@/lib/fonts'
import { boardPalette } from '@/lib/palette'
import { Link } from '@tanstack/react-router'
import { Copy, Droplets, FileText, ImageDown, Lock, Plus, Type } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FontCard } from './ItemView'

/** Board-wide creative direction: palette, font pairing and the AI brief, plus export. */
export function DirectionPanel({
  board,
  items,
  onExportPng,
}: {
  board: Board
  items: Item[]
  onExportPng: () => void
}) {
  const photos = items.filter((i): i is PhotoItem => i.kind === 'photo')
  const fonts = useAi('fonts')
  const brief = useAi('brief')
  const [extracting, setExtracting] = useState(false)
  const right = Math.max(0, ...items.map((i) => i.x + i.w)) + 48

  async function extract() {
    setExtracting(true)
    try {
      const palette = (await boardPalette(photos.map((p) => p.photo.thumb))).map((s) => s.hex)
      await touch(board.id, { palette })
    } finally {
      setExtracting(false)
    }
  }

  async function addPaletteToBoard() {
    for (const [i, color] of board.palette.entries())
      await addItem<SwatchItem>({
        boardId: board.id,
        kind: 'swatch',
        color,
        name: `Colour ${i + 1}`,
        x: right + i * 108,
        y: 0,
        w: 96,
        h: 120,
      })
  }

  const tags = [...new Set(photos.flatMap((p) => p.ai?.tags ?? []))].slice(0, 20)

  async function writeBrief() {
    await brief.run({
      title: board.title.slice(0, 100),
      ...(board.vibe && { vibe: board.vibe.slice(0, 300) }),
      images: photos.slice(0, 40).map((p) => ({
        alt: altOf(p).slice(0, 200),
        tags: (p.ai?.tags ?? []).slice(0, 8),
      })),
      notes: items
        .flatMap((i) => (i.kind === 'note' && i.text ? [i.text.slice(0, 300)] : []))
        .slice(0, 20),
      ...(board.palette.length && { palette: board.palette.slice(0, 12) }),
      ...(board.fonts && { fonts: [board.fonts.heading, board.fonts.body] }),
    })
  }

  async function applyFonts(heading: string, body: string, why: string) {
    await touch(board.id, { fonts: { heading, body, why } })
    await addItem<FontItem>({
      boardId: board.id,
      kind: 'font',
      font: { heading, body, why },
      x: right,
      y: 160,
      w: 260,
      h: 180,
    })
    toast.success(`${heading} + ${body} added to the board`)
  }

  const shownBrief = brief.text.trim() || board.brief
  // Save the brief once it has fully streamed in.
  const finished = brief.status === 'done' ? brief.text.trim() : ''
  useEffect(() => {
    if (finished && finished !== board.brief) void touch(board.id, { brief: finished })
  }, [finished, board.brief, board.id])

  return (
    <div className="flex flex-col gap-8 p-4">
      <section aria-labelledby="pal-h">
        <h3 id="pal-h" className="spec text-muted mb-2">
          Palette
        </h3>
        {board.palette.length > 0 ? (
          <ul className="flex h-14 overflow-hidden rounded-xl" aria-label="Board palette">
            {board.palette.map((c) => (
              <li
                key={c}
                className="flex min-w-0 flex-1 items-end overflow-hidden p-1"
                style={{ background: c }}
              >
                <span className="spec bg-bg/70 rounded px-1 text-[9px]">{c}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted text-sm">Add photos, then pull the palette out of them.</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" disabled={!photos.length || extracting} onClick={() => void extract()}>
            <Droplets /> {extracting ? 'Reading colours…' : 'Extract from photos'}
          </Button>
          {board.palette.length > 0 && (
            <>
              <Button size="sm" variant="ghost" onClick={() => void addPaletteToBoard()}>
                <Plus /> Add to board
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link to="/app/palette" search={{}}>
                  Contrast and export
                </Link>
              </Button>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="font-h">
        <h3 id="font-h" className="spec text-muted mb-2">
          Type
        </h3>
        {board.fonts && (
          <FontCard
            heading={board.fonts.heading}
            body={board.fonts.body}
            className="mb-2 h-36 rounded-lg"
          />
        )}
        <Button
          variant="ai"
          size="sm"
          disabled={fonts.status === 'running'}
          onClick={() =>
            void fonts.run({
              ...(board.vibe && { vibe: board.vibe.slice(0, 300) }),
              ...(board.palette.length && { palette: board.palette.slice(0, 12) }),
              tags,
            })
          }
        >
          <Type /> {fonts.status === 'running' ? 'Pairing…' : 'Suggest font pairings'}
        </Button>
        <AiNotice status={fonts.status} error={fonts.error} />
        <ul className="mt-3 flex flex-col gap-3">
          {fonts.items
            .filter((f) => isFontName(f.heading) && isFontName(f.body))
            .map((f) => (
              <li key={`${f.heading}-${f.body}`} className="border-line rounded-xl border p-2">
                <FontCard heading={f.heading} body={f.body} className="h-32 rounded-md" />
                <p className="text-muted mt-2 text-xs">{f.why}</p>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => void applyFonts(f.heading, f.body, f.why)}
                >
                  Use this pairing
                </Button>
              </li>
            ))}
        </ul>
      </section>

      <section aria-labelledby="brief-h">
        <h3 id="brief-h" className="spec text-muted mb-2">
          Creative brief
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ai"
            size="sm"
            disabled={brief.status === 'running' || !photos.length}
            onClick={() => void writeBrief()}
          >
            <FileText />{' '}
            {brief.status === 'running'
              ? 'Writing…'
              : shownBrief
                ? 'Rewrite the brief'
                : 'Write the brief'}
          </Button>
          {shownBrief && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                void navigator.clipboard
                  .writeText(shownBrief)
                  .then(() => toast.success('Brief copied as Markdown'))
              }
            >
              <Copy /> Copy
            </Button>
          )}
        </div>
        <AiNotice status={brief.status} error={brief.error} />
        {shownBrief && (
          <div className="border-line mt-3 rounded-xl border p-3" aria-live="polite">
            <Markdown text={shownBrief} />
          </div>
        )}
      </section>

      <section aria-labelledby="exp-h">
        <h3 id="exp-h" className="spec text-muted mb-2">
          Export
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={!items.length} onClick={onExportPng}>
            <ImageDown /> Board as PNG
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link to="/pro">
              <Lock /> Brand kit PDF and share link · Pro
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
