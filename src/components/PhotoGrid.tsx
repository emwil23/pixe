import { cn } from '@/lib/cn'
import { fallBackToOriginal, type Photo } from '@/lib/photos'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Plus, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Credit, SourceBadge } from './Credit'

/**
 * A virtualised masonry grid of search results. Each tile shows its source, real alt text and the credit;
 * only the rows on screen are in the DOM, so long result lists stay quick.
 */
export function PhotoGrid({
  photos,
  columns,
  onAdd,
  onMoreLike,
  addLabel = 'Add to board',
  onEndReached,
  scrollElement,
  className,
}: {
  photos: Photo[]
  columns: number
  onAdd?: (p: Photo) => void
  onMoreLike?: (p: Photo) => void
  addLabel?: string
  onEndReached?: () => void
  /** The element that scrolls; the window if left out. */
  scrollElement?: HTMLElement | null
  className?: string
}) {
  const parent = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = parent.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e?.contentRect.width ?? 0))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const gap = 12
  const colWidth = width ? (width - gap * (columns - 1)) / columns : 200
  const caption = 64

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual returns fresh functions by design
  const virtualizer = useVirtualizer({
    count: photos.length,
    lanes: columns,
    gap,
    overscan: 6,
    getScrollElement: () => scrollElement ?? parent.current?.closest('[data-scroll]') ?? null,
    estimateSize: (i) => {
      const p = photos[i]
      return p ? (colWidth * p.height) / Math.max(1, p.width) + caption : 300
    },
  })
  // Lanes depend on column width; recompute positions when it changes.
  useEffect(() => virtualizer.measure(), [colWidth, columns, virtualizer])

  const items = virtualizer.getVirtualItems()
  const last = items.at(-1)
  useEffect(() => {
    if (last && last.index >= photos.length - columns * 2) onEndReached?.()
  }, [last, photos.length, columns, onEndReached])

  return (
    <div ref={parent} className={cn('relative w-full', className)}>
      <ul
        aria-label="Search results"
        className="relative"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {items.map((v) => {
          const p = photos[v.index]
          if (!p) return null
          return (
            <li
              key={p.id}
              ref={virtualizer.measureElement}
              data-index={v.index}
              className="absolute top-0"
              style={{
                width: colWidth,
                left: v.lane * (colWidth + gap),
                transform: `translateY(${v.start}px)`,
              }}
            >
              <PhotoTile
                photo={p}
                {...(onAdd && { onAdd })}
                {...(onMoreLike && { onMoreLike })}
                addLabel={addLabel}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PhotoTile({
  photo,
  onAdd,
  onMoreLike,
  addLabel,
}: {
  photo: Photo
  onAdd?: (p: Photo) => void
  onMoreLike?: (p: Photo) => void
  addLabel: string
}) {
  const [loaded, setLoaded] = useState(false)
  const alt = photo.alt || `Photo by ${photo.author.name}`
  return (
    <figure className="group">
      <div
        className="relative overflow-hidden rounded-lg"
        style={{
          aspectRatio: `${photo.width} / ${photo.height}`,
          background: photo.color ?? 'var(--surface-2)',
        }}
      >
        <img
          src={photo.thumb}
          onError={(e) => fallBackToOriginal(e.currentTarget, photo)}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable
          onDragStart={(e) =>
            e.dataTransfer.setData('application/x-pixe-photo', JSON.stringify(photo))
          }
          onLoad={() => setLoaded(true)}
          className={cn(
            'size-full object-cover transition-[opacity,filter] duration-500',
            loaded ? 'blur-0 opacity-100' : 'opacity-0 blur-md',
          )}
        />
        <SourceBadge photo={photo} className="absolute top-2 left-2" />
        <div className="absolute right-2 bottom-2 flex gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          {onMoreLike && (
            <button
              type="button"
              onClick={() => onMoreLike(photo)}
              aria-label={`More like this: ${alt}`}
              className="bg-bg/85 text-text hover:bg-bg grid size-8 place-items-center rounded-full backdrop-blur-sm"
            >
              <Sparkles className="size-4" aria-hidden />
            </button>
          )}
          {onAdd && (
            <button
              type="button"
              onClick={() => onAdd(photo)}
              aria-label={`${addLabel}: ${alt}`}
              className="bg-accent text-accent-ink grid size-8 place-items-center rounded-full"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
      <figcaption className="mt-1.5">
        <Credit photo={photo} className="line-clamp-2 text-[11px] leading-snug" />
      </figcaption>
    </figure>
  )
}
