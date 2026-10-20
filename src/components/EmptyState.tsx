import type { ReactNode } from 'react'

/** An empty light table: one illustration, a line of copy and what to do next. */
export function EmptyState({
  art,
  title,
  children,
  action,
}: {
  /** Path without extension; a .webp must exist in public/media. */
  art: string
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
      <img
        src={`${art}.webp`}
        alt=""
        width={240}
        height={240}
        loading="lazy"
        className="mb-6 size-60 rounded-3xl object-cover"
      />
      <h2 className="font-display text-3xl">{title}</h2>
      {children && <p className="text-muted mt-2 text-sm">{children}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
