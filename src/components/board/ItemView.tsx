import { altOf } from '@/lib/board'
import { cn } from '@/lib/cn'
import type { Item } from '@/lib/db'
import { fontStack, loadGoogleFont } from '@/lib/fonts'
import { fallBackToOriginal, SOURCE_NAME } from '@/lib/photos'
import { useEffect, useState } from 'react'

/** How one item looks on the board. Pointer and keyboard handling live in the Canvas. */
export function ItemView({
  item,
  zoom,
  lifted,
  editing,
  onEditText,
}: {
  item: Item
  zoom: number
  lifted: boolean
  editing: boolean
  onEditText: (text: string) => void
}) {
  const lift = lifted && 'rotate-[1.5deg] shadow-2xl'
  switch (item.kind) {
    case 'photo': {
      // Use the small copy unless the print is big on screen.
      const src = item.w * zoom > 420 ? item.photo.src : item.photo.thumb
      return (
        <figure className={cn('print size-full transition-transform duration-150', lift)}>
          <img
            src={src}
            onError={(e) => fallBackToOriginal(e.currentTarget, item.photo)}
            alt={altOf(item)}
            draggable={false}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
            style={{ background: item.photo.color ?? '#2a2723' }}
          />
          <figcaption className="spec text-muted absolute top-full left-0 mt-1.5 w-full truncate text-[10px]">
            {SOURCE_NAME[item.photo.source]} · {item.photo.author.name}
          </figcaption>
        </figure>
      )
    }
    case 'note':
      return (
        <div
          className={cn(
            'shadow-print size-full overflow-hidden bg-[#f4ecd2] p-3 text-[15px] leading-snug text-[#2b2620] transition-transform duration-150',
            lift,
          )}
        >
          {editing ? (
            <NoteEditor text={item.text} onDone={onEditText} />
          ) : (
            <p className="whitespace-pre-wrap">{item.text || 'Double-click to write…'}</p>
          )}
        </div>
      )
    case 'swatch': {
      return (
        <div
          className={cn('print flex size-full flex-col transition-transform duration-150', lift)}
        >
          <div className="flex-1" style={{ background: item.color }} />
          <div className="pt-1.5 text-[#2b2620]">
            <p className="text-xs font-medium">{item.name}</p>
            <p className="spec text-[10px] opacity-70">{item.color}</p>
          </div>
        </div>
      )
    }
    case 'font':
      return <FontCard heading={item.font.heading} body={item.font.body} lifted={lifted} />
    case 'group':
      return (
        <div className="border-muted/60 size-full rounded-xl border-2 border-dashed">
          {editing ? (
            <GroupEditor label={item.label} onDone={onEditText} />
          ) : (
            <p className="spec text-muted bg-bg absolute -top-3 left-3 px-2">
              {item.label || 'Group'}
            </p>
          )}
        </div>
      )
  }
}

function NoteEditor({ text, onDone }: { text: string; onDone: (t: string) => void }) {
  const [value, setValue] = useState(text)
  return (
    <textarea
      // The note is being edited because the user asked to; focus follows that.
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
      aria-label="Note text"
      value={value}
      maxLength={300}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onDone(value)}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Escape') onDone(value)
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="size-full resize-none bg-transparent outline-none"
    />
  )
}

function GroupEditor({ label, onDone }: { label: string; onDone: (t: string) => void }) {
  const [value, setValue] = useState(label)
  return (
    <input
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
      aria-label="Group name"
      value={value}
      maxLength={40}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onDone(value)}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter' || e.key === 'Escape') onDone(value)
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="spec bg-bg text-text border-accent absolute -top-3 left-3 border px-2 outline-none"
    />
  )
}

export function FontCard({
  heading,
  body,
  lifted = false,
  className,
}: {
  heading: string
  body: string
  lifted?: boolean
  className?: string
}) {
  useEffect(() => {
    loadGoogleFont(heading)
    loadGoogleFont(body)
  }, [heading, body])
  return (
    <div
      className={cn(
        'print flex size-full flex-col justify-between p-4 text-[#2b2620] transition-transform duration-150',
        lifted && 'rotate-[1.5deg] shadow-2xl',
        className,
      )}
    >
      <p className="text-4xl leading-none" style={{ fontFamily: fontStack(heading) }}>
        Aa
      </p>
      <div>
        <p className="text-lg leading-tight" style={{ fontFamily: fontStack(heading) }}>
          {heading}
        </p>
        <p className="text-sm" style={{ fontFamily: fontStack(body) }}>
          {body}: the quick brown fox
        </p>
      </div>
    </div>
  )
}
