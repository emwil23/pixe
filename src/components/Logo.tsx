import { cn } from '@/lib/cn'

/** The Pixe mark: a tilted print on the light table, with one bright pixel in it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <g transform="rotate(-8 16 16)">
        <rect x="8" y="6.5" width="16" height="19" rx="1.5" fill="var(--accent-ink)" />
        <rect x="10" y="8.5" width="12" height="11" fill="var(--accent)" />
        <rect x="16.5" y="11" width="3.5" height="3.5" fill="var(--accent-ink)" />
      </g>
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className="font-display text-2xl leading-none italic">Pixe</span>
    </span>
  )
}
