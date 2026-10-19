import { beforeEach, describe, expect, it } from 'vitest'
import {
  addPhotos,
  bounds,
  createBoard,
  deleteBoard,
  itemsInside,
  masonry,
  readingOrder,
  titleFromVibe,
} from './board'
import { db, type GroupItem, type Item } from './db'
import type { Photo } from './photos'

const photo = (id: string, width = 400, height = 600): Photo => ({
  id,
  source: 'pexels',
  width,
  height,
  color: '#222222',
  alt: 'a photo',
  thumb: '',
  src: '',
  pageUrl: '',
  author: { name: 'Bo', url: null },
  license: null,
  downloadLocation: null,
})

beforeEach(async () => {
  await db.items.clear()
  await db.boards.clear()
})

describe('titleFromVibe', () => {
  it('takes the first phrase and capitalises it', () => {
    expect(titleFromVibe('cozy autumn café brand, film grain, warm')).toBe('Cozy autumn café brand')
    expect(titleFromVibe('  ')).toBe('Untitled board')
    expect(titleFromVibe('a'.repeat(80))).toHaveLength(48)
  })
})

describe('masonry', () => {
  it('fills the shortest column and keeps each aspect ratio', () => {
    const pos = masonry(
      [
        { width: 100, height: 200 },
        { width: 100, height: 100 },
        { width: 100, height: 100 },
      ],
      { columns: 2, width: 100, gap: 10 },
    )
    expect(pos).toEqual([
      { x: 0, y: 0, w: 100, h: 200 },
      { x: 110, y: 0, w: 100, h: 100 },
      { x: 110, y: 110, w: 100, h: 100 },
    ])
  })
})

describe('board items', () => {
  it('adds photos to the right of what is there, and deletes the board with its items', async () => {
    const board = await createBoard('moody coastal hotel')
    const first = await addPhotos(board.id, [photo('a'), photo('b', 600, 400)])
    const second = await addPhotos(board.id, [photo('c')])
    const b = bounds(first)
    expect(second[0]?.x).toBeGreaterThan((b?.x ?? 0) + (b?.w ?? 0))
    expect(first[1]?.h).toBe(Math.round((260 * 400) / 600))
    expect(new Set([...first, ...second].map((i) => i.z)).size).toBe(3)

    await deleteBoard(board.id)
    expect(await db.items.count()).toBe(0)
    expect(await db.boards.count()).toBe(0)
  })

  it('finds the items inside a group by their centre', () => {
    const group = { id: 'g', kind: 'group', x: 0, y: 0, w: 100, h: 100 } as GroupItem
    const items = [
      { id: 'in', kind: 'note', x: 10, y: 10, w: 20, h: 20 },
      { id: 'edge', kind: 'note', x: 80, y: 80, w: 60, h: 60 }, // centre at 110,110: outside
      group,
    ] as Item[]
    expect(itemsInside(group, items).map((i) => i.id)).toEqual(['in'])
  })

  it('orders items by rows for reading', () => {
    const items = [
      { id: 'b', x: 300, y: 10 },
      { id: 'c', x: 0, y: 400 },
      { id: 'a', x: 0, y: 50 },
    ]
    expect(readingOrder(items).map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })
})
