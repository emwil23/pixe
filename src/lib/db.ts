import Dexie, { type EntityTable } from 'dexie'
import type { Photo } from './photos'

export interface FontPair {
  heading: string
  body: string
  why?: string
}

export interface Board {
  id: string
  title: string
  /** The words the board was started from, if any. */
  vibe: string
  palette: string[]
  fonts: FontPair | null
  /** The AI creative brief, Markdown. */
  brief: string | null
  createdAt: number
  updatedAt: number
}

interface ItemBase {
  id: string
  boardId: string
  x: number
  y: number
  w: number
  h: number
  /** Stacking order; higher is in front. */
  z: number
}

export interface PhotoItem extends ItemBase {
  kind: 'photo'
  photo: Photo
  /** AI description of the image; preferred over the source's alt text. */
  ai: { alt: string; tags: string[]; query: string } | null
}
export interface NoteItem extends ItemBase {
  kind: 'note'
  text: string
}
export interface SwatchItem extends ItemBase {
  kind: 'swatch'
  color: string
  name: string
}
export interface FontItem extends ItemBase {
  kind: 'font'
  font: FontPair
}
/** A labelled frame; items inside it move with it. */
export interface GroupItem extends ItemBase {
  kind: 'group'
  label: string
}

export type Item = PhotoItem | NoteItem | SwatchItem | FontItem | GroupItem
export type ItemKind = Item['kind']

export const db = new Dexie('pixe') as Dexie & {
  boards: EntityTable<Board, 'id'>
  items: EntityTable<Item, 'id'>
}

db.version(1).stores({
  boards: 'id, updatedAt',
  items: 'id, boardId, kind',
})

export const uid = () => crypto.randomUUID()
