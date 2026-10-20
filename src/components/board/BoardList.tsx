import { Credit } from '@/components/Credit'
import { Button } from '@/components/ui/button'
import { altOf, readingOrder } from '@/lib/board'
import type { Item } from '@/lib/db'
import { Trash2 } from 'lucide-react'
import { labelOf } from './Canvas'

/** The accessible list view of a board: every item in reading order, with its credit and actions. */
export function BoardList({
  items,
  selectedId,
  onSelect,
  onDelete,
}: {
  items: Item[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  const ordered = readingOrder(items.filter((i) => i.kind !== 'group'))
  return (
    <ol aria-label="Board items" className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto p-4">
      {ordered.map((item) => (
        <li
          key={item.id}
          className="border-line data-[selected=true]:bg-surface flex items-start gap-4 border-b py-4"
          data-selected={item.id === selectedId}
        >
          {item.kind === 'photo' ? (
            <img
              src={item.photo.thumb}
              alt={altOf(item)}
              loading="lazy"
              className="size-24 shrink-0 rounded-md object-cover"
            />
          ) : item.kind === 'swatch' ? (
            <span className="size-24 shrink-0 rounded-md" style={{ background: item.color }} />
          ) : (
            <span className="bg-surface-2 spec text-muted grid size-24 shrink-0 place-items-center rounded-md">
              {item.kind}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className="text-left text-sm hover:underline"
            >
              {labelOf(item)}
            </button>
            {item.kind === 'photo' && <Credit photo={item.photo} className="mt-1" />}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remove ${labelOf(item)}`}
            onClick={() => onDelete(item.id)}
          >
            <Trash2 />
          </Button>
        </li>
      ))}
    </ol>
  )
}
