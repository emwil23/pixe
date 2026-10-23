import { cn } from '@/lib/cn'

/**
 * The source links each API asks for: Openverse wants apps to say they use it and are not endorsed by it,
 * and Unsplash wants credit.
 */
export function SourcesNote({ className }: { className?: string }) {
  const link = 'text-text underline underline-offset-2'
  return (
    <p className={cn('text-muted text-xs leading-relaxed', className)}>
      Photos provided by{' '}
      <a className={link} href="https://unsplash.com/?utm_source=pixe&utm_medium=referral">
        Unsplash
      </a>{' '}
      and{' '}
      <a className={link} href="https://openverse.org">
        Openverse
      </a>
      . Pixe is made using the Openverse API and is not endorsed or certified by Openverse. Check
      each photo's licence before you use it.
    </p>
  )
}
