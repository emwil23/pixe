import { EmptyState } from '@/components/EmptyState'
import { EXAMPLE_VIBES, NewBoardDialog } from '@/components/NewBoardDialog'
import { Button } from '@/components/ui/button'
import { createBoard, deleteBoard } from '@/lib/board'
import { db, type Board, type PhotoItem } from '@/lib/db'
import { Link, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Sheet {
  board: Board
  photos: PhotoItem[]
  count: number
}

function useSheets() {
  return useLiveQuery(async (): Promise<Sheet[]> => {
    const boards = await db.boards.orderBy('updatedAt').reverse().toArray()
    return Promise.all(
      boards.map(async (board) => {
        const items = await db.items.where({ boardId: board.id }).toArray()
        const photos = items
          .filter((i): i is PhotoItem => i.kind === 'photo')
          .sort((a, b) => a.y - b.y || a.x - b.x)
        return { board, photos: photos.slice(0, 6), count: items.length }
      }),
    )
  })
}

const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })

export function Dashboard() {
  const sheets = useSheets()
  const navigate = useNavigate()

  async function example(vibe: string) {
    const b = await createBoard(vibe)
    await navigate({ to: '/app/board/$boardId', params: { boardId: b.id }, search: { build: 1 } })
  }

  if (!sheets) return null
  if (!sheets.length)
    return (
      <EmptyState
        art="/media/empty-boards"
        title="Your light table is empty."
        action={
          <>
            <NewBoardDialog
              trigger={
                <Button variant="primary">
                  <Sparkles /> Describe a vibe
                </Button>
              }
            />
            <Button onClick={() => void example(EXAMPLE_VIBES[0] ?? 'autumn café')}>
              Try an example
            </Button>
          </>
        }
      >
        Describe a vibe and Pixe pulls real, credited stock photos onto a board, then the palette
        and fonts out of them.
      </EmptyState>
    )

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="spec text-accent-text">Contact sheets · {sheets.length}</p>
          <h1 className="font-display mt-1 text-5xl">Boards</h1>
        </div>
        <NewBoardDialog
          trigger={
            <Button variant="primary">
              <Plus /> New board
            </Button>
          }
        />
      </header>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sheets.map((s) => (
          <li key={s.board.id} className="group relative">
            <Link
              to="/app/board/$boardId"
              params={{ boardId: s.board.id }}
              className="border-line bg-surface hover:border-muted block rounded-2xl border p-3 transition-colors"
            >
              <ContactSheet photos={s.photos} />
              {s.board.palette.length > 0 && (
                <div className="mt-3 flex h-3 overflow-hidden rounded-full" aria-hidden>
                  {s.board.palette.map((c) => (
                    <span key={c} className="flex-1" style={{ background: c }} />
                  ))}
                </div>
              )}
              <h2 className="font-display mt-3 truncate text-2xl">{s.board.title}</h2>
              <p className="spec text-muted mt-1">
                {s.count} items · edited {dateFmt.format(s.board.updatedAt)}
              </p>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${s.board.title}`}
              className="bg-surface/90 absolute top-5 right-5 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
              onClick={() => {
                if (!confirm(`Delete “${s.board.title}”? This can't be undone.`)) return
                void deleteBoard(s.board.id).then(() => toast.success('Board deleted'))
              }}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Six slots like a contact sheet; empty slots show as outlines. */
function ContactSheet({ photos }: { photos: PhotoItem[] }) {
  return (
    <div className="grid aspect-[3/2] grid-cols-3 grid-rows-2 gap-1.5">
      {Array.from({ length: 6 }, (_, i) => {
        const p = photos[i]
        return p ? (
          <img
            key={p.id}
            src={p.photo.thumb}
            alt=""
            loading="lazy"
            className="size-full rounded-md object-cover"
            style={{ background: p.photo.color ?? undefined }}
          />
        ) : (
          <span key={i} className="border-line rounded-md border border-dashed" />
        )
      })}
    </div>
  )
}
