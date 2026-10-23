import { BoardList } from '@/components/board/BoardList'
import { Canvas, fitCamera, zoomAt, type Camera, type Change } from '@/components/board/Canvas'
import { DirectionPanel } from '@/components/board/DirectionPanel'
import { Inspector } from '@/components/board/Inspector'
import { SearchPanel } from '@/components/board/SearchPanel'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { addItem, addPhotos, bounds, touch } from '@/lib/board'
import { buildBoard, type BuildStep } from '@/lib/build'
import { cn } from '@/lib/cn'
import { db, type GroupItem, type NoteItem } from '@/lib/db'
import { trackDownload, type Photo } from '@/lib/photos'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  BoxSelect,
  List,
  Maximize,
  Minus,
  PanelRight,
  Plus,
  Search,
  Sparkles,
  StickyNote,
  SwatchBook,
} from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

type Tab = 'search' | 'direction' | 'item'

export function BoardPage() {
  const { boardId } = useParams({ from: '/shell/app/board/$boardId' })
  const { build } = useSearch({ from: '/shell/app/board/$boardId' })
  const navigate = useNavigate()
  // null once loaded and not found; undefined while loading.
  const board = useLiveQuery(async () => (await db.boards.get(boardId)) ?? null, [boardId])
  const items = useLiveQuery(() => db.items.where({ boardId }).toArray(), [boardId])
  const [camera, setCamera] = useState<Camera>({ x: 64, y: 64, zoom: 1 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<'canvas' | 'list'>('canvas')
  const [tab, setTab] = useState<Tab>('direction')
  const [panel, setPanel] = useState(() => matchMedia('(min-width: 1024px)').matches)
  const [query, setQuery] = useState<string | null>(null)
  const [progress, setProgress] = useState<BuildStep | null>(() =>
    build ? { step: 'queries', queries: [], ai: false } : null,
  )
  const area = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const fitted = useRef(false)
  const titleId = useId()

  const fit = useCallback(() => {
    const r = area.current?.getBoundingClientRect()
    if (r && items) setCamera(fitCamera(items, r.width, r.height))
  }, [items])

  // Fit the board once its items are first known.
  useEffect(() => {
    if (fitted.current || !items?.length) return
    fitted.current = true
    // After layout, so the viewport has its size.
    const raf = requestAnimationFrame(fit)
    return () => cancelAnimationFrame(raf)
  }, [items, fit])

  // A new board from a vibe: build it once, then drop ?build so a reload doesn't build again. The build
  // isn't cancelled on unmount: if you leave early, it still finishes filling the board.
  const started = useRef(false)
  useEffect(() => {
    if (!build || started.current) return
    started.current = true
    void navigate({ to: '.', search: {}, replace: true })
    buildBoard(boardId, setProgress, new AbortController().signal)
      .then(() => {
        fitted.current = false
      })
      .catch(() => toast.error('Could not build the board. Search and add photos by hand.'))
      .finally(() => setProgress(null))
  }, [build, boardId, navigate])

  const searchQuery = query ?? board?.vibe.split(',')[0]?.trim() ?? ''
  const selected = items?.find((i) => i.id === selectedId) ?? null
  const select = (id: string | null) => {
    setSelectedId(id)
    if (id) setTab('item')
  }

  if (board === undefined || items === undefined) return null
  if (!board)
    return (
      <EmptyState art="/media/empty-board" title="This board isn't here.">
        It may have been deleted, or it was made in another browser. Boards live in the browser that
        made them.
      </EmptyState>
    )

  const commit = (changes: Change[]) => {
    void db.transaction('rw', db.items, db.boards, async () => {
      for (const c of changes) await db.items.update(c.id, { x: c.x, y: c.y, w: c.w, h: c.h })
      await touch(boardId)
    })
  }
  const remove = (id: string) => {
    if (selectedId === id) setSelectedId(null)
    void db.items.delete(id).then(() => touch(boardId))
  }
  const raise = (id: string) =>
    void db.items.update(id, { z: Math.max(0, ...items.map((i) => i.z)) + 1 })

  /** The world point at the middle of the visible board, for new items. */
  const centre = () => {
    const r = area.current?.getBoundingClientRect()
    return {
      x: Math.round(((r?.width ?? 800) / 2 - camera.x) / camera.zoom),
      y: Math.round(((r?.height ?? 600) / 2 - camera.y) / camera.zoom),
    }
  }

  const addPhoto = (p: Photo, at?: { x: number; y: number }) =>
    void addPhotos(boardId, [p], at ?? centre()).then(([item]) => {
      if (item) select(item.id)
      toast.success('Added to the board')
    })

  async function addNote() {
    const c = centre()
    const note = await addItem<NoteItem>({
      boardId,
      kind: 'note',
      text: '',
      x: c.x - 100,
      y: c.y - 70,
      w: 200,
      h: 140,
    })
    select(note.id)
  }

  async function addGroup() {
    const c = centre()
    const g = await addItem<GroupItem>({
      boardId,
      kind: 'group',
      label: 'Group',
      x: c.x - 300,
      y: c.y - 200,
      w: 600,
      h: 400,
    })
    select(g.id)
  }

  async function exportPng() {
    const world = worldRef.current
    const b = bounds(items ?? [])
    if (!world || !b) return
    setView('canvas')
    const pad = 48
    const { toPng } = await import('html-to-image')
    try {
      const url = await toPng(world, {
        width: b.w + pad * 2,
        height: b.h + pad * 2 + 24,
        pixelRatio: 2,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg'),
        style: { transform: `translate(${pad - b.x}px, ${pad - b.y}px) scale(1)` },
        cacheBust: false,
      })
      const a = document.createElement('a')
      a.href = url
      a.download = `${board?.title ?? 'board'}.png`
      a.click()
      for (const i of items ?? []) if (i.kind === 'photo') trackDownload(i.photo)
    } catch {
      toast.error('Export failed: a photo could not be read. Try again in a moment.')
    }
  }

  const zoomBy = (f: number) => {
    const r = area.current?.getBoundingClientRect()
    setCamera((c) => zoomAt(c, c.zoom * f, (r?.width ?? 0) / 2, (r?.height ?? 0) / 2))
  }

  const tool =
    'text-muted hover:text-text hover:bg-surface-2 grid size-9 place-items-center rounded-full [&_svg]:size-4'

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:h-[calc(100dvh-57px)]">
      <div className="border-line flex flex-wrap items-center gap-1 border-b px-3 py-1.5">
        <label htmlFor={titleId} className="sr-only">
          Board title
        </label>
        <input
          id={titleId}
          defaultValue={board.title}
          key={board.title}
          maxLength={100}
          onBlur={(e) => {
            const t = e.target.value.trim()
            if (t && t !== board.title) void touch(boardId, { title: t })
          }}
          className="font-display focus:bg-surface min-w-0 flex-1 rounded-md bg-transparent px-2 text-2xl outline-none sm:max-w-md"
        />
        <div className="ml-auto flex items-center gap-0.5" role="toolbar" aria-label="Board tools">
          <button
            type="button"
            className={tool}
            onClick={() => void addNote()}
            aria-label="Add a note"
          >
            <StickyNote />
          </button>
          <button
            type="button"
            className={tool}
            onClick={() => void addGroup()}
            aria-label="Add a group"
          >
            <BoxSelect />
          </button>
          <span className="bg-line mx-1 h-5 w-px" aria-hidden />
          <button
            type="button"
            className={tool}
            onClick={() => zoomBy(1 / 1.2)}
            aria-label="Zoom out"
          >
            <Minus />
          </button>
          <span className="spec text-muted w-12 text-center" aria-live="polite">
            {Math.round(camera.zoom * 100)}%
          </span>
          <button type="button" className={tool} onClick={() => zoomBy(1.2)} aria-label="Zoom in">
            <Plus />
          </button>
          <button type="button" className={tool} onClick={fit} aria-label="Fit the board">
            <Maximize />
          </button>
          <span className="bg-line mx-1 h-5 w-px" aria-hidden />
          <button
            type="button"
            className={cn(tool, view === 'list' && 'bg-surface-2 text-text')}
            onClick={() => setView(view === 'list' ? 'canvas' : 'list')}
            aria-pressed={view === 'list'}
            aria-label="List view"
          >
            <List />
          </button>
          <button
            type="button"
            className={cn(tool, panel && 'bg-surface-2 text-text')}
            onClick={() => setPanel(!panel)}
            aria-pressed={panel}
            aria-label="Side panel"
          >
            <PanelRight />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-[60dvh] flex-1 lg:min-h-0">
        <div ref={area} className="relative flex min-w-0 flex-1 flex-col">
          {view === 'canvas' ? (
            <Canvas
              items={items}
              camera={camera}
              setCamera={setCamera}
              selectedId={selectedId}
              onSelect={select}
              onCommit={commit}
              onDelete={remove}
              onRaise={raise}
              onEditText={(id, text) =>
                void db.items.update(id, (i) => {
                  if (i.kind === 'note') i.text = text
                  if (i.kind === 'group') i.label = text
                })
              }
              onDropPhoto={addPhoto}
              worldRef={worldRef}
            />
          ) : (
            <BoardList
              items={items}
              selectedId={selectedId}
              onSelect={(id) => {
                select(id)
                setPanel(true)
              }}
              onDelete={remove}
            />
          )}
          {!items.length && !progress && view === 'canvas' && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="pointer-events-auto text-center">
                <p className="font-display text-3xl">An empty light table.</p>
                <p className="text-muted mt-1 text-sm">Search for photos and drag them here.</p>
                <Button
                  className="mt-4"
                  variant="primary"
                  onClick={() => {
                    setPanel(true)
                    setTab('search')
                  }}
                >
                  <Search /> Search photos
                </Button>
              </div>
            </div>
          )}
          {progress && <BuildProgress step={progress} />}
        </div>

        {panel && (
          <aside
            aria-label="Board panel"
            className="border-line bg-surface fixed inset-x-0 bottom-0 z-20 flex h-[70dvh] flex-col rounded-t-2xl border-t lg:static lg:h-auto lg:w-[380px] lg:rounded-none lg:border-t-0 lg:border-l"
          >
            <div role="tablist" aria-label="Panel" className="border-line flex gap-1 border-b p-2">
              {(
                [
                  ['search', 'Search', Search],
                  ['direction', 'Direction', SwatchBook],
                  ['item', 'Selected', Sparkles],
                ] as const
              ).map(([t, label, Icon]) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  disabled={t === 'item' && !selected}
                  onClick={() => setTab(t)}
                  className="text-muted aria-selected:bg-surface-2 aria-selected:text-text flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm disabled:opacity-40 [&_svg]:size-4"
                >
                  <Icon aria-hidden /> {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPanel(false)}
                className="text-muted rounded-full px-2 text-sm lg:hidden"
              >
                Close
              </button>
            </div>
            <div
              role="tabpanel"
              aria-label={tab}
              className={cn('flex min-h-0 flex-1 flex-col', tab !== 'search' && 'overflow-y-auto')}
            >
              {tab === 'search' && (
                <SearchPanel
                  key={searchQuery}
                  initial={searchQuery}
                  onAdd={(p) => addPhoto(p)}
                  onMoreLike={(p) => setQuery(p.alt.split(/[,.]/)[0] ?? p.alt)}
                />
              )}
              {tab === 'direction' && (
                <DirectionPanel board={board} items={items} onExportPng={() => void exportPng()} />
              )}
              {tab === 'item' && selected && (
                <Inspector
                  item={selected}
                  onDelete={() => remove(selected.id)}
                  onMoreLike={(q) => {
                    setQuery(q)
                    setTab('search')
                  }}
                />
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

function BuildProgress({ step }: { step: BuildStep }) {
  const lines: Record<BuildStep['step'], string> = {
    queries: 'Reading the vibe…',
    search: 'Pulling photos from Unsplash and Openverse…',
    palette: 'Extracting the palette…',
    done: 'Done.',
  }
  return (
    <div
      role="status"
      className="bg-bg/70 absolute inset-0 z-10 grid place-items-center backdrop-blur-sm"
    >
      <div className="text-center">
        <p className="font-display text-4xl italic">{lines[step.step]}</p>
        {step.step === 'queries' && step.queries.length > 0 && (
          <ul className="mt-4 flex flex-wrap justify-center gap-1.5">
            {step.queries.map((q) => (
              <li key={q} className="spec border-line rounded-full border px-2.5 py-1">
                {q}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
