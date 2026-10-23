import { useAi } from '@/ai/useAi'
import { AiNotice } from '@/components/AiNotice'
import { EmptyState } from '@/components/EmptyState'
import { PhotoGrid } from '@/components/PhotoGrid'
import { SourcesNote } from '@/components/SourcesNote'
import { Button } from '@/components/ui/button'
import { useSearch } from '@/hooks/useSearch'
import { addPhotos, createBoard } from '@/lib/board'
import { cn } from '@/lib/cn'
import { db } from '@/lib/db'
import {
  PHOTO_COLORS,
  SOURCE_NAME,
  SOURCES,
  type Photo,
  type PhotoColor,
  type PhotoQuery,
} from '@/lib/photos'
import { useSettings } from '@/stores/settings'
import { useNavigate, useSearch as useRouteSearch } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, Wand2 } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { toast } from 'sonner'

const SWATCH: Record<PhotoColor, string> = {
  black: '#111',
  white: '#f4f4f4',
  yellow: '#f5c518',
  orange: '#f28c28',
  red: '#d7263d',
  purple: '#7b4fd6',
  pink: '#f27eb1',
  green: '#3aa655',
  teal: '#1aa6a6',
  blue: '#2f6fe0',
}

const chip =
  'border-line text-muted hover:text-text rounded-full border px-3 py-1 text-xs aria-pressed:border-accent-text aria-pressed:text-text'

export function Discover() {
  const { q: initial = '' } = useRouteSearch({ from: '/shell/app/discover' })
  const navigate = useNavigate()
  const settings = useSettings()
  const [text, setText] = useState(initial)
  const [filters, setFilters] = useState<Omit<PhotoQuery, 'page'>>({ q: initial })
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)
  const boards = useLiveQuery(() => db.boards.orderBy('updatedAt').reverse().toArray())
  const [picked, setTarget] = useState('')
  const target = picked || boards?.[0]?.id || ''
  const expand = useAi('queries')
  const describe = useAi('describe')
  const searchId = useId()
  const boardSel = useId()
  const { photos, failed, loading, loadMore } = useSearch(filters, settings.sources)

  const search = (q: string) => {
    setText(q)
    setFilters((f) => ({ ...f, q }))
    void navigate({ to: '.', search: q ? { q } : {}, replace: true })
  }

  async function add(p: Photo) {
    const boardId = target || (await createBoard('', 'Discoveries')).id
    if (!target) setTarget(boardId)
    await addPhotos(boardId, [p])
    toast.success(`Added to “${boards?.find((b) => b.id === boardId)?.title ?? 'Discoveries'}”`)
  }

  async function moreLike(p: Photo) {
    const [out] = await describe.run({
      imageUrl: p.thumb,
      ...(p.alt && { sourceAlt: p.alt.slice(0, 200) }),
    })
    search(out?.query || p.alt.split(/[,.]/)[0]?.trim() || text)
  }

  const toggleSource = (s: (typeof SOURCES)[number]) => {
    const next = settings.sources.includes(s)
      ? settings.sources.filter((x) => x !== s)
      : [...settings.sources, s]
    if (next.length) settings.set({ sources: next })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:h-[calc(100dvh-57px)]">
      <div className="border-line border-b px-4 py-4 sm:px-6">
        <h1 className="sr-only">Discover</h1>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            search(text.trim())
          }}
          className="flex flex-wrap gap-2"
        >
          <label htmlFor={searchId} className="sr-only">
            Search photos, or describe an idea
          </label>
          <div className="border-line bg-surface focus-within:border-accent-text flex min-w-0 flex-1 items-center gap-2 rounded-full border px-4">
            <Search className="text-muted size-4 shrink-0" aria-hidden />
            <input
              id={searchId}
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search, or describe an idea: “quiet morning in a ceramic studio”"
              maxLength={100}
              className="h-11 min-w-0 flex-1 bg-transparent outline-none"
            />
          </div>
          <Button type="submit" variant="primary" className="h-11">
            Search
          </Button>
          <Button
            type="button"
            variant="ai"
            className="h-11"
            disabled={text.trim().length < 2 || expand.status === 'running'}
            onClick={() => void expand.run({ vibe: text.trim() })}
          >
            <Wand2 /> {expand.status === 'running' ? 'Thinking…' : 'Expand with AI'}
          </Button>
        </form>
        <AiNotice status={expand.status} error={expand.error} />
        {expand.items.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="AI search ideas">
            {expand.items.map((i) => (
              <li key={i.query}>
                <button
                  type="button"
                  onClick={() => search(i.query)}
                  aria-pressed={filters.q === i.query}
                  className={chip}
                >
                  <span className="spec text-accent-text mr-1.5 text-[10px]">{i.angle}</span>
                  {i.query}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <fieldset className="flex flex-wrap items-center gap-1.5">
            <legend className="spec text-muted float-left mr-2">Sources</legend>
            {SOURCES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={settings.sources.includes(s)}
                onClick={() => toggleSource(s)}
                className={chip}
              >
                {SOURCE_NAME[s]}
              </button>
            ))}
          </fieldset>
          <fieldset className="flex flex-wrap items-center gap-1.5">
            <legend className="spec text-muted float-left mr-2">Shape</legend>
            {(['landscape', 'portrait', 'square'] as const).map((o) => (
              <button
                key={o}
                type="button"
                aria-pressed={filters.orientation === o}
                onClick={() =>
                  setFilters((f) => ({ ...f, orientation: f.orientation === o ? undefined : o }))
                }
                className={chip}
              >
                {o}
              </button>
            ))}
          </fieldset>
          <fieldset className="flex flex-wrap items-center gap-1">
            <legend className="spec text-muted float-left mr-2">Colour</legend>
            {PHOTO_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={filters.color === c}
                aria-label={c}
                title={c}
                onClick={() => setFilters((f) => ({ ...f, color: f.color === c ? undefined : c }))}
                className={cn(
                  'border-line size-6 rounded-full border-2',
                  filters.color === c && 'border-accent-text ring-bg ring-2',
                )}
                style={{ background: SWATCH[c] }}
              />
            ))}
          </fieldset>
          <fieldset className="flex flex-wrap items-center gap-1.5">
            <legend className="spec text-muted float-left mr-2">Licence</legend>
            {(
              [
                ['any', 'Any'],
                ['commercial', 'Commercial use'],
                ['modification', 'Can modify'],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={(filters.license ?? 'any') === v}
                onClick={() => setFilters((f) => ({ ...f, license: v }))}
                className={chip}
              >
                {label}
              </button>
            ))}
          </fieldset>
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor={boardSel} className="spec text-muted">
              Add to
            </label>
            <select
              id={boardSel}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="border-line bg-surface h-9 max-w-48 rounded-full border px-3 text-sm"
            >
              {!boards?.length && <option value="">A new board</option>}
              {boards?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div
        ref={setScroller}
        data-scroll
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
      >
        <p role="status" className="spec text-muted mb-3">
          {loading
            ? 'Searching…'
            : filters.q
              ? `${photos.length} photos for “${filters.q}”`
              : 'Search three free photo libraries at once.'}
          {failed.length > 0 && ` · ${failed.map((s) => SOURCE_NAME[s]).join(', ')} unavailable`}
          {filters.license !== 'any' &&
            filters.license &&
            ' · Unsplash photos are all free for commercial use'}
        </p>
        <AiNotice status={describe.status} error={describe.error} />
        {!loading && photos.length === 0 ? (
          <EmptyState
            art="/media/empty-search"
            title={filters.q ? 'Nothing developed.' : 'What are you looking for?'}
          >
            {filters.q
              ? 'No photos matched. Try fewer words, another colour, or Expand with AI.'
              : 'Type a subject, a mood or a whole idea. Pixe searches Unsplash and Openverse at once.'}
          </EmptyState>
        ) : (
          <ResponsiveGrid
            photos={photos}
            onAdd={(p) => void add(p)}
            onMoreLike={(p) => void moreLike(p)}
            onEndReached={loadMore}
            scrollElement={scroller}
          />
        )}
        <SourcesNote className="mx-auto mt-10 max-w-xl text-center" />
      </div>
    </div>
  )
}

function ResponsiveGrid(props: Omit<Parameters<typeof PhotoGrid>[0], 'columns'>) {
  const [cols, setCols] = useState(() => columnsFor(window.innerWidth))
  useEffect(() => {
    const on = () => setCols(columnsFor(window.innerWidth))
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return <PhotoGrid {...props} columns={cols} />
}

const columnsFor = (w: number) => (w < 640 ? 2 : w < 1024 ? 3 : w < 1440 ? 4 : 5)
