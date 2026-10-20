import { bounds, itemsInside } from '@/lib/board'
import { cn } from '@/lib/cn'
import type { Item } from '@/lib/db'
import type { Photo } from '@/lib/photos'
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { ItemView } from './ItemView'

/** Screen position = world position × zoom + (x, y). */
export interface Camera {
  x: number
  y: number
  zoom: number
}

export type Change = Pick<Item, 'id' | 'x' | 'y' | 'w' | 'h'>

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 3
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

/** Zooms around a point on screen (the cursor, or the middle), keeping that point still. */
export function zoomAt(cam: Camera, zoom: number, cx: number, cy: number): Camera {
  const z = clampZoom(zoom)
  return { zoom: z, x: cx - ((cx - cam.x) * z) / cam.zoom, y: cy - ((cy - cam.y) * z) / cam.zoom }
}

/** The camera that fits all items in a viewport, never zooming in past 100%. */
export function fitCamera(items: Item[], width: number, height: number, pad = 64): Camera {
  const b = bounds(items)
  if (!b || !width || !height) return { x: pad, y: pad, zoom: 1 }
  const zoom = clampZoom(Math.min(1, (width - pad * 2) / b.w, (height - pad * 2) / b.h))
  return {
    zoom,
    x: (width - b.w * zoom) / 2 - b.x * zoom,
    y: (height - b.h * zoom) / 2 - b.y * zoom,
  }
}

type Gesture =
  | { kind: 'move'; px: number; py: number; start: Map<string, Change>; moved: boolean }
  | { kind: 'resize'; px: number; py: number; item: Item; ratio: number | null }
  | { kind: 'pan'; px: number; py: number; cam: Camera }
  | { kind: 'pinch'; dist: number; cam: Camera; cx: number; cy: number }

/**
 * The infinite board. Items are real DOM elements (focusable, with alt text), placed in one transformed
 * layer. Drag to move, the corner handle to resize, drag the background or scroll to pan, Ctrl+scroll or
 * pinch to zoom. Every pointer action has a keyboard twin (see the help text below).
 */
export function Canvas({
  items,
  camera,
  setCamera,
  selectedId,
  onSelect,
  onCommit,
  onDelete,
  onRaise,
  onEditText,
  onDropPhoto,
  worldRef,
}: {
  items: Item[]
  camera: Camera
  setCamera: (c: Camera | ((c: Camera) => Camera)) => void
  selectedId: string | null
  onSelect: (id: string | null) => void
  onCommit: (changes: Change[]) => void
  onDelete: (id: string) => void
  onRaise: (id: string) => void
  onEditText: (id: string, text: string) => void
  onDropPhoto: (photo: Photo, at: { x: number; y: number }) => void
  worldRef: React.RefObject<HTMLDivElement | null>
}) {
  const viewport = useRef<HTMLDivElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const [draft, setDraft] = useState<Map<string, Change>>(new Map())
  const [editing, setEditing] = useState<string | null>(null)

  // Wheel must be a non-passive listener so it can stop the page from scrolling.
  useEffect(() => {
    const el = viewport.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey)
        setCamera((c) =>
          zoomAt(c, c.zoom * Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top),
        )
      else setCamera((c) => ({ ...c, x: c.x - e.deltaX, y: c.y - e.deltaY }))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [setCamera])

  const placed = (i: Item) => ({ ...i, ...draft.get(i.id) })

  function startMove(e: RPointerEvent, item: Item) {
    if (e.button !== 0 || editing === item.id) return
    e.stopPropagation()
    onSelect(item.id)
    const moving = item.kind === 'group' ? [item, ...itemsInside(item, items)] : [item]
    gesture.current = {
      kind: 'move',
      px: e.clientX,
      py: e.clientY,
      start: new Map(moving.map((m) => [m.id, { id: m.id, x: m.x, y: m.y, w: m.w, h: m.h }])),
      moved: false,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function startResize(e: RPointerEvent, item: Item) {
    e.stopPropagation()
    gesture.current = {
      kind: 'resize',
      px: e.clientX,
      py: e.clientY,
      item,
      ratio: item.kind === 'photo' ? item.h / item.w : null,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: RPointerEvent) {
    const g = gesture.current
    if (pointers.current.has(e.pointerId))
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (!g) return
    if (g.kind === 'move') {
      const dx = (e.clientX - g.px) / camera.zoom
      const dy = (e.clientY - g.py) / camera.zoom
      if (!g.moved && Math.hypot(dx, dy) < 3) return
      g.moved = true
      setDraft(
        new Map(
          [...g.start.values()].map((s) => [
            s.id,
            { ...s, x: Math.round(s.x + dx), y: Math.round(s.y + dy) },
          ]),
        ),
      )
    } else if (g.kind === 'resize') {
      const w = Math.max(80, Math.round(g.item.w + (e.clientX - g.px) / camera.zoom))
      const h = g.ratio
        ? Math.round(w * g.ratio)
        : Math.max(60, Math.round(g.item.h + (e.clientY - g.py) / camera.zoom))
      setDraft(new Map([[g.item.id, { id: g.item.id, x: g.item.x, y: g.item.y, w, h }]]))
    } else if (g.kind === 'pan') {
      setCamera({ ...g.cam, x: g.cam.x + e.clientX - g.px, y: g.cam.y + e.clientY - g.py })
    } else {
      const [a, b] = [...pointers.current.values()]
      if (!a || !b) return
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      setCamera(zoomAt(g.cam, (g.cam.zoom * dist) / g.dist, g.cx, g.cy))
    }
  }

  function endGesture(e: RPointerEvent) {
    pointers.current.delete(e.pointerId)
    const g = gesture.current
    gesture.current = null
    if (g && (g.kind === 'resize' || (g.kind === 'move' && g.moved)) && draft.size)
      onCommit([...draft.values()])
    setDraft(new Map())
  }

  function onBackgroundDown(e: RPointerEvent) {
    if (e.target !== e.currentTarget && e.target !== worldRef.current) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    onSelect(null)
    setEditing(null)
    const r = e.currentTarget.getBoundingClientRect()
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      if (a && b)
        gesture.current = {
          kind: 'pinch',
          dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
          cam: camera,
          cx: (a.x + b.x) / 2 - r.left,
          cy: (a.y + b.y) / 2 - r.top,
        }
    } else gesture.current = { kind: 'pan', px: e.clientX, py: e.clientY, cam: camera }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onItemKey(e: React.KeyboardEvent, item: Item) {
    if (editing === item.id) return
    const step = e.shiftKey ? 40 : 8
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const d = arrows[e.key]
    if (d) {
      e.preventDefault()
      const moving = item.kind === 'group' ? [item, ...itemsInside(item, items)] : [item]
      onCommit(moving.map((m) => ({ id: m.id, x: m.x + d[0], y: m.y + d[1], w: m.w, h: m.h })))
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      onDelete(item.id)
    } else if (e.key === ']') onRaise(item.id)
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(item.id)
      if (item.kind === 'note' || item.kind === 'group') setEditing(item.id)
    } else if (e.key === 'Escape') onSelect(null)
  }

  function onViewportKey(e: React.KeyboardEvent) {
    if (e.target !== e.currentTarget) return
    const r = e.currentTarget.getBoundingClientRect()
    const pan: Record<string, [number, number]> = {
      ArrowLeft: [60, 0],
      ArrowRight: [-60, 0],
      ArrowUp: [0, 60],
      ArrowDown: [0, -60],
    }
    const p = pan[e.key]
    if (p) {
      e.preventDefault()
      setCamera((c) => ({ ...c, x: c.x + p[0], y: c.y + p[1] }))
    } else if (e.key === '+' || e.key === '=')
      setCamera((c) => zoomAt(c, c.zoom * 1.2, r.width / 2, r.height / 2))
    else if (e.key === '-') setCamera((c) => zoomAt(c, c.zoom / 1.2, r.width / 2, r.height / 2))
    else if (e.key === '0') setCamera(fitCamera(items, r.width, r.height))
  }

  const sorted = [...items].sort(
    (a, b) => (a.kind === 'group' ? -1 : 0) - (b.kind === 'group' ? -1 : 0) || a.z - b.z,
  )

  return (
    // jsx-a11y doesn't count role=application as interactive, but it is the right role for a canvas
    // editor whose arrow keys pan and zoom.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={viewport}
      role="application"
      aria-roledescription="board canvas"
      aria-label="Board canvas"
      aria-describedby="canvas-help"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- see above
      tabIndex={0}
      onKeyDown={onViewportKey}
      onPointerDown={onBackgroundDown}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/x-pixe-photo')) e.preventDefault()
      }}
      onDrop={(e) => {
        const raw = e.dataTransfer.getData('application/x-pixe-photo')
        if (!raw) return
        e.preventDefault()
        const r = e.currentTarget.getBoundingClientRect()
        onDropPhoto(JSON.parse(raw) as Photo, {
          x: Math.round((e.clientX - r.left - camera.x) / camera.zoom),
          y: Math.round((e.clientY - r.top - camera.y) / camera.zoom),
        })
      }}
      className="desk relative min-h-0 flex-1 touch-none overflow-hidden outline-none select-none"
      style={{
        backgroundPosition: `${camera.x}px ${camera.y}px`,
        backgroundSize: `${24 * camera.zoom}px ${24 * camera.zoom}px`,
      }}
    >
      <p id="canvas-help" className="sr-only">
        Tab to an item. Arrow keys move it, Shift with arrows moves further, Delete removes it, the
        right bracket brings it to the front, Enter selects it or edits a note. On the canvas
        itself, arrow keys pan, plus and minus zoom, and 0 fits the board. A list view of the board
        is in the toolbar.
      </p>
      <div
        ref={worldRef}
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})` }}
      >
        {sorted.map((raw) => {
          const item = placed(raw)
          const selected = item.id === selectedId
          return (
            <div
              key={item.id}
              data-item-id={item.id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={labelOf(item)}
              onPointerDown={(e) => startMove(e, raw)}
              onKeyDown={(e) => onItemKey(e, raw)}
              onFocus={() => onSelect(item.id)}
              onDoubleClick={() =>
                (item.kind === 'note' || item.kind === 'group') && setEditing(item.id)
              }
              className={cn(
                'absolute cursor-grab outline-none active:cursor-grabbing',
                selected && 'ring-accent ring-2 ring-offset-2 ring-offset-transparent',
                draft.has(item.id) && 'z-[9999]',
              )}
              style={{
                left: item.x,
                top: item.y,
                width: item.w,
                height: item.h,
                zIndex: item.kind === 'group' ? 0 : item.z,
              }}
            >
              <ItemView
                item={item}
                zoom={camera.zoom}
                lifted={draft.has(item.id)}
                editing={editing === item.id}
                onEditText={(text) => {
                  setEditing(null)
                  onEditText(item.id, text)
                }}
              />
              {selected && editing !== item.id && (
                <span
                  aria-hidden
                  onPointerDown={(e) => startResize(e, raw)}
                  className="bg-accent border-bg absolute -right-2 -bottom-2 size-4 cursor-nwse-resize rounded-full border-2"
                  style={{ transform: `scale(${1 / camera.zoom})` }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function labelOf(item: Item): string {
  switch (item.kind) {
    case 'photo':
      return `Photo: ${item.ai?.alt || item.photo.alt || 'untitled'}, by ${item.photo.author.name}`
    case 'note':
      return `Note: ${item.text || 'empty'}`
    case 'swatch':
      return `Colour swatch ${item.name}, ${item.color}`
    case 'font':
      return `Font pairing: ${item.font.heading} with ${item.font.body}`
    case 'group':
      return `Group: ${item.label || 'untitled'}`
  }
}
