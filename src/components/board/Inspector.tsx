import { useAi } from '@/ai/useAi'
import { AiNotice } from '@/components/AiNotice'
import { Credit } from '@/components/Credit'
import { Button } from '@/components/ui/button'
import { addItem, altOf, touch } from '@/lib/board'
import { db, type Item, type PhotoItem, type SwatchItem } from '@/lib/db'
import { extractSwatches, type Swatch } from '@/lib/palette'
import { SOURCE_NAME } from '@/lib/photos'
import { ArrowUpRight, Droplets, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { useId, useState } from 'react'
import { labelOf } from './Canvas'

/** Details and actions for the selected item. */
export function Inspector({
  item,
  onMoreLike,
  onDelete,
}: {
  item: Item
  onMoreLike: (query: string) => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-col gap-5 p-4">
      {item.kind === 'photo' ? (
        <PhotoDetails key={item.id} item={item} onMoreLike={onMoreLike} />
      ) : item.kind === 'swatch' ? (
        <SwatchDetails item={item} />
      ) : (
        <p className="text-sm">{labelOf(item)}</p>
      )}
      <Button variant="danger" size="sm" className="self-start" onClick={onDelete}>
        <Trash2 /> Remove from board
      </Button>
    </div>
  )
}

function PhotoDetails({
  item,
  onMoreLike,
}: {
  item: PhotoItem
  onMoreLike: (query: string) => void
}) {
  const describe = useAi('describe')
  const [swatches, setSwatches] = useState<Swatch[] | null>(null)
  const p = item.photo

  async function runDescribe() {
    const [out] = await describe.run({
      imageUrl: p.thumb,
      ...(p.alt && { sourceAlt: p.alt.slice(0, 200) }),
    })
    // Model output is untrusted: keep only well-formed fields.
    const o = (out ?? {}) as Partial<Record<string, unknown>>
    if (typeof o.alt !== 'string' || !o.alt) return null
    const ai = {
      alt: o.alt.slice(0, 200),
      tags: Array.isArray(o.tags)
        ? o.tags.filter((t): t is string => typeof t === 'string').slice(0, 8)
        : [],
      query: typeof o.query === 'string' ? o.query.slice(0, 100) : '',
    }
    await db.items.update(item.id, (i) => {
      if (i.kind === 'photo') i.ai = ai
    })
    return ai
  }

  async function moreLike() {
    const ai = item.ai ?? (await runDescribe())
    onMoreLike(ai?.query || p.alt.split(/[,.]/)[0] || '')
  }

  async function addSwatches(list: Swatch[]) {
    let y = item.y
    for (const s of list.slice(0, 5)) {
      await addItem<SwatchItem>({
        boardId: item.boardId,
        kind: 'swatch',
        color: s.hex,
        name: s.name,
        x: item.x + item.w + 24,
        y,
        w: 96,
        h: 120,
      })
      y += 132
    }
  }

  return (
    <>
      <img
        src={p.thumb}
        alt=""
        className="print w-full"
        style={{ aspectRatio: `${p.width} / ${p.height}` }}
      />
      <div>
        <p className="spec text-muted">
          {SOURCE_NAME[p.source]} · {p.width}×{p.height}
          {p.color && ` · ${p.color}`}
        </p>
        <Credit photo={p} className="mt-1 text-sm" />
        {p.license && (
          <p className="text-muted mt-1 text-xs">
            Licence:{' '}
            <a href={p.license.url} className="text-text underline underline-offset-2">
              {p.license.name}
            </a>
          </p>
        )}
      </div>

      <section aria-labelledby="alt-h">
        <h3 id="alt-h" className="spec text-muted mb-1.5">
          Alt text {item.ai ? '· AI' : '· from source'}
        </h3>
        <p className="text-sm">{altOf(item)}</p>
        {item.ai && item.ai.tags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1" aria-label="Tags">
            {item.ai.tags.map((t) => (
              <li key={t} className="spec border-line rounded-full border px-2 py-0.5 text-[10px]">
                {t}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="ai"
            size="sm"
            disabled={describe.status === 'running'}
            onClick={() => void runDescribe()}
          >
            <Wand2 /> {describe.status === 'running' ? 'Looking…' : 'Describe with AI'}
          </Button>
          <Button size="sm" onClick={() => void moreLike()}>
            <Sparkles /> More like this
          </Button>
        </div>
        <div className="mt-2">
          <AiNotice status={describe.status} error={describe.error} />
        </div>
      </section>

      <section aria-labelledby="sw-h">
        <h3 id="sw-h" className="spec text-muted mb-1.5">
          Palette of this photo
        </h3>
        {swatches ? (
          <>
            <ul className="flex h-10 overflow-hidden rounded-lg" aria-label="Colours">
              {swatches.map((s) => (
                <li
                  key={s.hex}
                  className="flex-1"
                  style={{ background: s.hex }}
                  title={`${s.name} ${s.hex}`}
                >
                  <span className="sr-only">
                    {s.name} {s.hex}
                  </span>
                </li>
              ))}
            </ul>
            <Button size="sm" className="mt-2" onClick={() => void addSwatches(swatches)}>
              Add swatches to board
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={() =>
              void extractSwatches(p.thumb)
                .then(setSwatches)
                .catch(() => setSwatches([]))
            }
          >
            <Droplets /> Extract colours
          </Button>
        )}
      </section>

      <a
        href={p.pageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted hover:text-text inline-flex items-center gap-1 text-sm"
      >
        View on {SOURCE_NAME[p.source]} <ArrowUpRight className="size-4" aria-hidden />
      </a>
    </>
  )
}

function SwatchDetails({ item }: { item: SwatchItem }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-3">
      <div className="h-24 rounded-lg" style={{ background: item.color }} />
      <label htmlFor={id} className="spec text-muted">
        Colour
      </label>
      <input
        id={id}
        type="color"
        value={item.color}
        onChange={(e) => {
          const color = e.target.value
          void db.items.update(item.id, (i) => {
            if (i.kind === 'swatch') i.color = color
          })
          void touch(item.boardId)
        }}
        className="h-10 w-full cursor-pointer rounded-lg"
      />
      <p className="spec">{item.color}</p>
    </div>
  )
}
