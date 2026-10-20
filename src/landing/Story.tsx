import { cn } from '@/lib/cn'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef, useState } from 'react'

gsap.registerPlugin(ScrollTrigger)

const BEATS = [
  {
    key: 'describe',
    n: '01',
    title: 'Describe',
    body: '“Cozy autumn café brand, film grain, warm.” A sentence is enough. The AI turns it into five searches: the subject, a texture, the light, a place and a detail.',
    alt: 'A sentence written on paper dissolving into floating empty frames',
  },
  {
    key: 'curate',
    n: '02',
    title: 'Curate',
    body: 'Pixe searches Unsplash, Pexels and Openverse at once and lays real, credited photos on an infinite board. Drag, resize, group, add notes.',
    alt: 'Prints dropping onto a dark light table in a loose grid',
  },
  {
    key: 'extract',
    n: '03',
    title: 'Extract',
    body: 'The palette comes out of the photos on your device. Then font pairings, WCAG contrast checks and a one-page creative brief.',
    alt: 'Colour swatches and a type specimen card peeling off a print',
  },
  {
    key: 'share',
    n: '04',
    title: 'Share',
    body: 'Export the board as a PNG, or the palette as CSS, Tailwind or Figma tokens. Every photo keeps its credit.',
    alt: 'A moodboard folding into a small card with a link chain',
  },
] as const

/**
 * The four-beat scroll story. On big screens the art stays put while the copy scrolls and the active beat
 * swaps the picture; with reduced motion (and on phones) it is a plain list.
 */
export function Story({ animate }: { animate: boolean }) {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!animate || !root.current) return
    const ctx = gsap.context(() => {
      root.current?.querySelectorAll('[data-beat]').forEach((el, i) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => self.isActive && setActive(i),
        })
      })
      gsap.from('[data-ruler]', {
        scaleX: 0,
        transformOrigin: 'left',
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top 70%',
          end: 'bottom bottom',
          scrub: true,
        },
      })
    }, root)
    return () => ctx.revert()
  }, [animate])

  return (
    <section ref={root} id="how" aria-labelledby="how-h" className="relative scroll-mt-20 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <p className="spec text-accent-text">How it works</p>
        <h2 id="how-h" className="font-display mt-3 max-w-3xl text-5xl leading-[0.95] md:text-7xl">
          From a sentence to a <em>direction</em> in four moves.
        </h2>
        <div data-ruler className="ruler-x mt-10 h-3 w-full" aria-hidden />
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl gap-10 px-6 md:grid-cols-[1fr_1.1fr]">
        <ol className="flex flex-col">
          {BEATS.map((b, i) => (
            <li
              key={b.key}
              data-beat
              className={cn(
                'border-line flex min-h-[60vh] flex-col justify-center border-t py-10 transition-opacity duration-500 md:min-h-[70vh]',
                animate && active !== i && 'md:opacity-35',
              )}
            >
              <p className="spec text-muted">{b.n} / 04</p>
              <h3 className="font-display mt-2 text-5xl italic md:text-6xl">{b.title}</h3>
              <p className="text-muted mt-4 max-w-md text-lg">{b.body}</p>
              {/* Phones see each beat's art inline. */}
              <img
                src={`/media/step-${b.key}.webp`}
                alt={b.alt}
                width={720}
                height={720}
                loading="lazy"
                className="print mt-8 aspect-square w-full max-w-sm object-cover md:hidden"
              />
            </li>
          ))}
        </ol>
        <div className="sticky top-24 hidden h-[70vh] items-center md:flex">
          <div className="relative aspect-square w-full">
            {BEATS.map((b, i) => (
              <img
                key={b.key}
                src={`/media/step-${b.key}.webp`}
                alt={active === i ? b.alt : ''}
                aria-hidden={active !== i}
                width={720}
                height={720}
                loading="lazy"
                className={cn(
                  'print absolute inset-0 size-full object-cover transition-[opacity,transform] duration-700',
                  active === i ? 'rotate-[-1.5deg] opacity-100' : 'rotate-[2deg] opacity-0',
                )}
              />
            ))}
            <p className="spec bg-bg text-muted absolute -bottom-8 left-0">
              Fig. {BEATS[active]?.n} · {BEATS[active]?.title}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
