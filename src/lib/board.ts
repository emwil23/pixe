import { db, uid, type Board, type GroupItem, type Item, type PhotoItem } from './db'
import type { Photo } from './photos'

export const PHOTO_WIDTH = 260
const GAP = 24

/** A short title from a vibe: "cozy autumn café brand, film grain" → "Cozy autumn café brand". */
export const titleFromVibe = (vibe: string) => {
  const first = vibe.split(/[,.;\n]/)[0]?.trim() ?? ''
  const t = first.length > 48 ? `${first.slice(0, 47).trimEnd()}…` : first
  return t ? `${t.charAt(0).toUpperCase()}${t.slice(1)}` : 'Untitled board'
}

export async function createBoard(vibe = '', title = titleFromVibe(vibe)): Promise<Board> {
  const now = Date.now()
  const board: Board = {
    id: uid(),
    title,
    vibe,
    palette: [],
    fonts: null,
    brief: null,
    createdAt: now,
    updatedAt: now,
  }
  await db.boards.add(board)
  return board
}

export const touch = (boardId: string, patch: Partial<Board> = {}) =>
  db.boards.update(boardId, { ...patch, updatedAt: Date.now() })

export async function deleteBoard(boardId: string) {
  await db.transaction('rw', db.boards, db.items, async () => {
    await db.items.where({ boardId }).delete()
    await db.boards.delete(boardId)
  })
}

/** The space everything on the board covers, or null for an empty board. */
export function bounds(items: Pick<Item, 'x' | 'y' | 'w' | 'h'>[]) {
  if (!items.length) return null
  const x = Math.min(...items.map((i) => i.x))
  const y = Math.min(...items.map((i) => i.y))
  return {
    x,
    y,
    w: Math.max(...items.map((i) => i.x + i.w)) - x,
    h: Math.max(...items.map((i) => i.y + i.h)) - y,
  }
}

/**
 * Masonry layout: each photo goes into the shortest column, at its own aspect ratio.
 * Returns positions in the same order as the photos.
 */
export function masonry(
  sizes: { width: number; height: number }[],
  {
    columns,
    x = 0,
    y = 0,
    width = PHOTO_WIDTH,
    gap = GAP,
  }: {
    columns: number
    x?: number
    y?: number
    width?: number
    gap?: number
  },
) {
  const heights = Array.from({ length: columns }, () => y)
  return sizes.map((s) => {
    const col = heights.indexOf(Math.min(...heights))
    const h = Math.round((width * s.height) / Math.max(1, s.width))
    const pos = { x: x + col * (width + gap), y: heights[col] ?? y, w: width, h }
    heights[col] = pos.y + h + gap
    return pos
  })
}

/** Adds photos to a board: at a point (one dropped photo), or as new masonry columns to the right. */
export async function addPhotos(boardId: string, photos: Photo[], at?: { x: number; y: number }) {
  const existing = await db.items.where({ boardId }).toArray()
  const b = bounds(existing)
  let z = Math.max(0, ...existing.map((i) => i.z))
  const columns = Math.min(4, Math.max(1, Math.ceil(photos.length / 3)))
  const spots = at
    ? photos.map((_, i) => ({ x: at.x + i * 24, y: at.y + i * 24, w: PHOTO_WIDTH }))
    : masonry(photos, { columns, x: b ? b.x + b.w + GAP * 2 : 0, y: b ? b.y : 0 })
  const items: PhotoItem[] = photos.map((photo, i) => {
    const s = spots[i] ?? { x: 0, y: 0, w: PHOTO_WIDTH }
    return {
      id: uid(),
      boardId,
      kind: 'photo',
      photo,
      ai: null,
      x: s.x,
      y: s.y,
      w: s.w,
      h: Math.round((s.w * photo.height) / Math.max(1, photo.width)),
      z: ++z,
    }
  })
  await db.items.bulkAdd(items)
  await touch(boardId)
  return items
}

export async function addItem<T extends Item>(item: Omit<T, 'id' | 'z'>): Promise<T> {
  const top = await db.items.where({ boardId: item.boardId }).toArray()
  const full = { ...item, id: uid(), z: Math.max(0, ...top.map((i) => i.z)) + 1 } as T
  await db.items.add(full)
  await touch(item.boardId)
  return full
}

/** Items whose centre lies inside the group frame: they move with it. */
export function itemsInside(group: GroupItem, items: Item[]) {
  return items.filter((i) => {
    if (i.id === group.id || i.kind === 'group') return false
    const cx = i.x + i.w / 2
    const cy = i.y + i.h / 2
    return cx >= group.x && cx <= group.x + group.w && cy >= group.y && cy <= group.y + group.h
  })
}

/** Reading order for the list view and keyboard: top to bottom, then left to right, by rows. */
export function readingOrder<T extends Pick<Item, 'x' | 'y'>>(items: T[], rowHeight = 200): T[] {
  return [...items].sort(
    (a, b) => Math.floor(a.y / rowHeight) - Math.floor(b.y / rowHeight) || a.x - b.x,
  )
}

/** The text alternative for a photo on the board: the AI description first, then the source's own. */
export const altOf = (item: PhotoItem) =>
  item.ai?.alt || item.photo.alt || `Photo by ${item.photo.author.name}`
