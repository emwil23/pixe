import { Fragment, type ReactNode } from 'react'

/** Inline **bold** only; everything renders as text nodes, so model output can't inject HTML. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="text-text font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}

/** The small Markdown the brief uses: ## headings, bullet lists and paragraphs. */
export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  let list: string[] = []
  const flush = () => {
    if (list.length)
      blocks.push(
        <ul key={blocks.length} className="mt-2 list-disc space-y-1 pl-5">
          {list.map((l, i) => (
            <li key={i}>{inline(l)}</li>
          ))}
        </ul>,
      )
    list = []
  }
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    const bullet = /^[-*•]\s+(.*)$/.exec(line)
    if (bullet?.[1] !== undefined) {
      list.push(bullet[1])
      continue
    }
    flush()
    if (!line) continue
    const h = /^#{1,4}\s+(.*)$/.exec(line)
    blocks.push(
      h?.[1] !== undefined ? (
        <h3 key={blocks.length} className="font-display text-text mt-4 text-xl first:mt-0">
          {h[1]}
        </h3>
      ) : (
        <p key={blocks.length} className="mt-2">
          {inline(line)}
        </p>
      ),
    )
  }
  flush()
  return <div className="text-muted text-sm leading-relaxed">{blocks}</div>
}
