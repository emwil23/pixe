import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import {
  grade,
  harmony,
  HARMONIES,
  inkFor,
  toCssVariables,
  toDesignTokens,
  toTailwind,
  type Harmony,
  type NamedColor,
} from '@/lib/color'
import { db } from '@/lib/db'
import { extractSwatches } from '@/lib/palette'
import { useLiveQuery } from 'dexie-react-hooks'
import { Copy, Download, ImageUp } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { toast } from 'sonner'

const FORMATS = {
  css: { label: 'CSS variables', file: 'palette.css', make: toCssVariables },
  tailwind: { label: 'Tailwind v4', file: 'theme.css', make: toTailwind },
  tokens: { label: 'Figma tokens', file: 'tokens.json', make: toDesignTokens },
} as const

/**
 * Drop an image, get its palette, harmonies, contrast checks and tokens. Everything runs in this
 * browser: the image is never uploaded, and no AI is involved.
 */
export function PalettePage() {
  const [image, setImage] = useState<string | null>(null)
  const [colors, setColors] = useState<NamedColor[]>([])
  const [dragging, setDragging] = useState(false)
  const boards = useLiveQuery(() => db.boards.orderBy('updatedAt').reverse().toArray())
  const fileId = useId()
  const boardId = useId()

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image)
    },
    [image],
  )

  async function read(file: File | undefined) {
    if (!file?.type.startsWith('image/')) return toast.error('Drop an image file.')
    const url = URL.createObjectURL(file)
    setImage(url)
    try {
      setColors((await extractSwatches(url)).map(({ name, hex }) => ({ name, hex })))
    } catch {
      toast.error('Could not read the colours in that image.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <p className="spec text-accent-text">On this device · no upload</p>
      <h1 className="font-display mt-1 text-5xl">Palette</h1>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <label
          htmlFor={fileId}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            void read(e.dataTransfer.files[0])
          }}
          className={cn(
            'border-line hover:border-muted flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-5 transition-colors',
            dragging && 'border-accent-text bg-accent/5',
          )}
        >
          {image ? (
            <img src={image} alt="" className="print h-20 w-28 object-cover" />
          ) : (
            <ImageUp className="text-muted size-8" aria-hidden />
          )}
          <span>
            <span className="block font-medium">Drop an image, or choose one</span>
            <span className="text-muted text-sm">It stays in your browser.</span>
          </span>
          <input
            id={fileId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void read(e.target.files?.[0])}
          />
        </label>
        {boards && boards.some((b) => b.palette.length) && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={boardId} className="spec text-muted">
              Or use a board's palette
            </label>
            <select
              id={boardId}
              defaultValue=""
              onChange={(e) => {
                const b = boards.find((x) => x.id === e.target.value)
                if (b) {
                  setImage(null)
                  setColors(b.palette.map((hex, i) => ({ name: `Colour ${i + 1}`, hex })))
                }
              }}
              className="border-line bg-surface h-11 rounded-full border px-4 text-sm"
            >
              <option value="" disabled>
                Choose a board
              </option>
              {boards
                .filter((b) => b.palette.length)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {colors.length === 0 ? (
        <EmptyState art="/media/empty-palette" title="No colours yet.">
          Pixe pulls six swatches out of any photo: vibrant, muted, dark and light.
        </EmptyState>
      ) : (
        <>
          <Strips
            colors={colors}
            onRename={(i, name) => setColors(colors.map((c, j) => (j === i ? { ...c, name } : c)))}
          />
          <Harmonies key={colors[0]?.hex} base={colors[0]?.hex ?? '#000000'} colors={colors} />
          <ContrastGrid colors={colors} />
          <Export colors={colors} />
        </>
      )}
    </div>
  )
}

function Strips({
  colors,
  onRename,
}: {
  colors: NamedColor[]
  onRename: (i: number, name: string) => void
}) {
  return (
    <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Swatches">
      {colors.map((c, i) => (
        <li key={`${c.hex}-${i}`} className="print flex flex-col">
          <button
            type="button"
            onClick={() =>
              void navigator.clipboard.writeText(c.hex).then(() => toast.success(`${c.hex} copied`))
            }
            className="grid h-40 place-items-end p-2 text-left"
            style={{ background: c.hex, color: inkFor(c.hex) }}
            aria-label={`Copy ${c.hex}`}
          >
            <span className="spec">{c.hex}</span>
          </button>
          <label className="sr-only" htmlFor={`name-${i}`}>
            Name for {c.hex}
          </label>
          <input
            id={`name-${i}`}
            value={c.name}
            maxLength={30}
            onChange={(e) => onRename(i, e.target.value)}
            className="mt-1.5 bg-transparent px-1 text-sm text-[#2b2620] outline-none"
          />
        </li>
      ))}
    </ul>
  )
}

function Harmonies({ base: first, colors }: { base: string; colors: NamedColor[] }) {
  const [base, setBase] = useState(first)
  const [kind, setKind] = useState<Harmony>('complementary')
  return (
    <section aria-labelledby="harm-h" className="mt-12">
      <h2 id="harm-h" className="font-display text-3xl">
        Harmonies
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="spec text-muted">Base</span>
        {colors.map((c, i) => (
          <button
            key={`${c.hex}-${i}`}
            type="button"
            aria-label={`Use ${c.name} as base`}
            aria-pressed={base === c.hex}
            onClick={() => setBase(c.hex)}
            className="border-line aria-pressed:ring-accent-text size-7 rounded-full border aria-pressed:ring-2"
            style={{ background: c.hex }}
          />
        ))}
        <span className="bg-line mx-2 h-5 w-px" aria-hidden />
        {(Object.keys(HARMONIES) as Harmony[]).map((h) => (
          <button
            key={h}
            type="button"
            aria-pressed={kind === h}
            onClick={() => setKind(h)}
            className="border-line text-muted aria-pressed:border-accent-text aria-pressed:text-text rounded-full border px-3 py-1 text-xs"
          >
            {h}
          </button>
        ))}
      </div>
      <ul className="mt-4 flex h-24 overflow-hidden rounded-2xl" aria-label={`${kind} harmony`}>
        {harmony(base, kind).map((hex) => (
          <li
            key={hex}
            className="flex flex-1 items-end p-2"
            style={{ background: hex, color: inkFor(hex) }}
          >
            <span className="spec">{hex}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ContrastGrid({ colors }: { colors: NamedColor[] }) {
  const all = [...colors, { name: 'White', hex: '#ffffff' }, { name: 'Black', hex: '#000000' }]
  return (
    <section aria-labelledby="con-h" className="mt-12">
      <h2 id="con-h" className="font-display text-3xl">
        Contrast
      </h2>
      <p className="text-muted mt-1 text-sm">
        Text colour (rows) on background (columns). AA needs 4.5:1 for body text and 3:1 for large
        text; AAA needs 7:1.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Text colour</span>
              </th>
              {all.map((bg) => (
                <th key={bg.hex} scope="col" className="spec text-muted px-1 font-normal">
                  {bg.hex}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {all.map((fg) => (
              <tr key={fg.hex}>
                <th scope="row" className="spec text-muted pr-2 text-left font-normal">
                  {fg.hex}
                </th>
                {all.map((bg) => {
                  if (fg.hex === bg.hex) return <td key={bg.hex} />
                  const g = grade(fg.hex, bg.hex)
                  const label = g.aaa ? 'AAA' : g.aa ? 'AA' : g.aaLarge ? 'AA large' : 'Fail'
                  return (
                    <td
                      key={bg.hex}
                      className="h-14 w-20 rounded-md px-2 text-center"
                      style={{ background: bg.hex, color: fg.hex }}
                    >
                      <span className="block font-semibold">{g.ratio.toFixed(2)}</span>
                      <span className="text-[10px]">{label}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Export({ colors }: { colors: NamedColor[] }) {
  const [format, setFormat] = useState<keyof typeof FORMATS>('css')
  const f = FORMATS[format]
  const code = f.make(colors)
  return (
    <section aria-labelledby="exp-h" className="mt-12 mb-8">
      <h2 id="exp-h" className="font-display text-3xl">
        Export
      </h2>
      <div role="tablist" aria-label="Format" className="mt-3 flex flex-wrap gap-1.5">
        {(Object.keys(FORMATS) as (keyof typeof FORMATS)[]).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={format === k}
            onClick={() => setFormat(k)}
            className="border-line text-muted aria-selected:border-accent-text aria-selected:text-text rounded-full border px-3 py-1 text-sm"
          >
            {FORMATS[k].label}
          </button>
        ))}
      </div>
      <pre
        role="tabpanel"
        aria-label={f.label}
        className="border-line bg-surface mt-3 overflow-x-auto rounded-xl border p-4 font-mono text-sm"
      >
        {code}
      </pre>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={() =>
            void navigator.clipboard.writeText(code).then(() => toast.success('Copied'))
          }
        >
          <Copy /> Copy
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const a = document.createElement('a')
            a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' }))
            a.download = f.file
            a.click()
            URL.revokeObjectURL(a.href)
          }}
        >
          <Download /> Download {f.file}
        </Button>
      </div>
    </section>
  )
}
