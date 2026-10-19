import { cn } from '@/lib/cn'
import { X } from 'lucide-react'
import { Dialog as D } from 'radix-ui'
import type { ComponentProps, ReactNode } from 'react'

export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close

/** A centred dialog, or a right-hand sheet with `side`. Title is required for screen readers. */
export function DialogContent({
  title,
  description,
  side = false,
  hideTitle = false,
  className,
  children,
  ...props
}: ComponentProps<typeof D.Content> & {
  title: string
  description?: string
  side?: boolean
  hideTitle?: boolean
  children: ReactNode
}) {
  return (
    <D.Portal>
      <D.Overlay className="data-[state=open]:animate-in fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
      <D.Content
        className={cn(
          'border-line bg-surface text-text fixed z-50 shadow-2xl outline-none',
          side
            ? 'inset-y-0 right-0 w-full max-w-lg overflow-y-auto border-l p-6'
            : 'top-[12vh] left-1/2 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border p-5',
          className,
        )}
        {...(description ? {} : { 'aria-describedby': undefined })}
        {...props}
      >
        <D.Title className={cn('font-display text-2xl', hideTitle && 'sr-only')}>{title}</D.Title>
        {description && (
          <D.Description className="text-muted mt-1 text-sm">{description}</D.Description>
        )}
        {children}
        <D.Close
          className="text-muted hover:bg-surface-2 hover:text-text absolute top-4 right-4 rounded-lg p-1.5"
          aria-label="Close"
        >
          <X className="size-4" />
        </D.Close>
      </D.Content>
    </D.Portal>
  )
}
