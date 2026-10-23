import { createBoard } from '@/lib/board'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Sparkles } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'

export const EXAMPLE_VIBES = [
  'Cozy autumn café brand, film grain, warm',
  'Brutalist architecture studio, concrete, overcast light',
  'Coastal hotel in the 70s, sun-faded, terracotta',
  'Night market street food, neon, steam',
]

/** "New board": describe a vibe and Pixe builds the board, or start empty. */
export function NewBoardDialog({
  trigger,
  openFromUrl = false,
}: {
  trigger?: React.ReactNode
  /** The PWA shortcut and the landing page open the header's dialog with ?new=1. */
  openFromUrl?: boolean
}) {
  const [open, setOpen] = useState(
    () => openFromUrl && new URLSearchParams(location.search).has('new'),
  )
  const [vibe, setVibe] = useState('')
  const navigate = useNavigate()
  const id = useId()

  async function start(build: boolean) {
    const board = await createBoard(build ? vibe.trim() : '')
    setOpen(false)
    setVibe('')
    await navigate({
      to: '/app/board/$boardId',
      params: { boardId: board.id },
      search: build ? { build: 1 } : {},
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="primary" size="sm">
            <Plus /> <span className="hidden sm:inline">New board</span>
            <span className="sr-only sm:hidden">New board</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        title="Describe a vibe"
        description="Pixe searches Unsplash and Openverse, lays the photos out and pulls the palette."
      >
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (vibe.trim().length >= 2) void start(true)
          }}
        >
          <label htmlFor={id} className="sr-only">
            Vibe
          </label>
          <textarea
            id={id}
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
            maxLength={300}
            rows={3}
            placeholder="e.g. cozy autumn café brand, film grain, warm"
            className="border-line bg-bg focus:border-accent-text w-full resize-none rounded-xl border p-3 text-base outline-none"
          />
          <ul className="flex flex-wrap gap-1.5" aria-label="Examples">
            {EXAMPLE_VIBES.map((v) => (
              <li key={v}>
                <button
                  type="button"
                  onClick={() => setVibe(v)}
                  className="border-line text-muted hover:text-text hover:border-muted rounded-full border px-2.5 py-1 text-xs"
                >
                  {v}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="ghost" onClick={() => void start(false)}>
              Start an empty board
            </Button>
            <Button type="submit" variant="primary" disabled={vibe.trim().length < 2}>
              <Sparkles /> Build the board
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
