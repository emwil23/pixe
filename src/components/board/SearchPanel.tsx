import { PhotoGrid } from '@/components/PhotoGrid'
import { SourcesNote } from '@/components/SourcesNote'
import { useSearch } from '@/hooks/useSearch'
import type { Photo } from '@/lib/photos'
import { useSettings } from '@/stores/settings'
import { Search } from 'lucide-react'
import { useId, useState } from 'react'

/**
 * The board's search drawer: every source at once; add a photo with + or drag it onto the board.
 * Give it `key={initial}` so a new query from "More like this" starts a fresh search.
 */
export function SearchPanel({
  initial,
  onAdd,
  onMoreLike,
}: {
  initial: string
  onAdd: (p: Photo) => void
  onMoreLike: (p: Photo) => void
}) {
  const sources = useSettings((s) => s.sources)
  const [text, setText] = useState(initial)
  const [q, setQ] = useState(initial)
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)
  const id = useId()
  const { photos, failed, loading, loadMore } = useSearch({ q }, sources)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form
        role="search"
        className="p-3"
        onSubmit={(e) => {
          e.preventDefault()
          setQ(text)
        }}
      >
        <label htmlFor={id} className="sr-only">
          Search photos
        </label>
        <div className="border-line bg-bg focus-within:border-accent-text flex items-center gap-2 rounded-full border px-3">
          <Search className="text-muted size-4 shrink-0" aria-hidden />
          <input
            id={id}
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search Unsplash and Openverse"
            maxLength={100}
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </form>
      <div ref={setScroller} data-scroll className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        <p role="status" className="spec text-muted mb-2">
          {loading ? 'Searching…' : q ? `${photos.length} photos for “${q}”` : 'Type a search'}
          {failed.length > 0 && ` · ${failed.join(', ')} unavailable`}
        </p>
        <PhotoGrid
          photos={photos}
          columns={2}
          onAdd={onAdd}
          onMoreLike={onMoreLike}
          onEndReached={loadMore}
          scrollElement={scroller}
        />
        <SourcesNote className="mt-6" />
      </div>
    </div>
  )
}
