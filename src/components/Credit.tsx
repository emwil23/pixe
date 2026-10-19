import { cn } from '@/lib/cn'
import { creditParts, SOURCE_NAME, type Photo } from '@/lib/photos'

/** The credit line each source asks for, with its links. */
export function Credit({ photo, className }: { photo: Photo; className?: string }) {
  return (
    <p className={cn('text-muted text-xs', className)}>
      {creditParts(photo).map((c, i) =>
        c.href ? (
          <a
            key={i}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text underline decoration-1 underline-offset-2 hover:decoration-2"
          >
            {c.text}
          </a>
        ) : (
          <span key={i}>{c.text}</span>
        ),
      )}
    </p>
  )
}

/** "UNSPLASH" style badge. */
export function SourceBadge({ photo, className }: { photo: Photo; className?: string }) {
  return (
    <span
      className={cn(
        'spec bg-bg/80 text-text rounded-full px-2 py-0.5 text-[10px] backdrop-blur-sm',
        className,
      )}
    >
      {SOURCE_NAME[photo.source]}
    </span>
  )
}
