import { LoopVideo } from '@/components/LoopVideo'
import { SourcesNote } from '@/components/SourcesNote'
import { Button } from '@/components/ui/button'
import { prerendered, useReducedMotionSafe } from '@/lib/boot'
import { cn } from '@/lib/cn'
import { Story } from '@/landing/Story'
import { useSmoothScroll } from '@/landing/useSmoothScroll'
import { PLANS } from '@/pages/Pro'
import { Link, useNavigate } from '@tanstack/react-router'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, Contrast, Droplets, FileText, ScanEye, Sparkles, Type } from 'lucide-react'
import { motion } from 'motion/react'
import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from 'react'

gsap.registerPlugin(ScrollTrigger)

const Hero3D = lazy(() => import('@/landing/Hero3D'))

/** WebGL only when it helps: wide screens, a real GPU, no reduced motion and no save-data. */
function useCan3D(reduce: boolean) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    if (reduce || !matchMedia('(min-width: 768px)').matches) return
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (conn?.saveData) return
    const gl = document.createElement('canvas').getContext('webgl2')
    if (!gl) return
    // Software rendering (no GPU) would spin the CPU for a decoration; the still carries the hero.
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) return
    // Wait until the page is idle so the 3D bundle never competes with the first paint.
    const id = requestIdleCallback(() => setOk(true), { timeout: 2500 })
    return () => cancelIdleCallback(id)
  }, [reduce])
  return ok
}

/** If the 3D scene fails (a texture 404, a lost context), the still image is already there. */
class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  override render() {
    return this.state.failed ? null : this.props.children
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export function Landing() {
  const reduce = useReducedMotionSafe()
  const can3D = useCan3D(reduce)
  useSmoothScroll(!reduce)

  return (
    <>
      <Hero can3D={can3D} />
      <Story animate={!reduce} />
      <PullsOut />
      <Credits />
      <AiSection reduce={reduce} />
      <Pricing />
      <DeveloperCard />
    </>
  )
}

const VIBES = [
  'cozy autumn café brand, film grain, warm',
  'brutalist architecture studio, concrete, overcast',
  'coastal hotel in the 70s, sun-faded, terracotta',
]

function Hero({ can3D }: { can3D: boolean }) {
  const section = useRef<HTMLElement>(null)
  const progress = useRef(0)
  const navigate = useNavigate()
  const [vibe, setVibe] = useState('')
  const inputId = useId()

  // Scroll through the hero drives the 3D scene: 0 = cards floating, 1 = landed, palette out.
  useEffect(() => {
    if (!can3D || !section.current) return
    const intro = { v: 0 }
    const tween = gsap.to(intro, { v: 0.3, duration: 2.4, ease: 'power2.out', delay: 0.3 })
    const st = ScrollTrigger.create({
      trigger: section.current,
      start: 'top top',
      end: 'bottom top',
    })
    // A short intro brings the cards in a little on load; scrolling then lands them.
    const tick = () => {
      progress.current = st.progress > 0 ? Math.max(intro.v, 0.3 + st.progress * 0.9) : intro.v
    }
    gsap.ticker.add(tick)
    return () => {
      tween.kill()
      st.kill()
      gsap.ticker.remove(tick)
    }
  }, [can3D])

  async function start(e: SyntheticEvent) {
    e.preventDefault()
    const v = vibe.trim() || VIBES[0] || ''
    // Load the database code only now, so the landing page stays light.
    const { createBoard } = await import('@/lib/board')
    const board = await createBoard(v)
    await navigate({
      to: '/app/board/$boardId',
      params: { boardId: board.id },
      search: { build: 1 },
    })
  }

  return (
    <section
      ref={section}
      aria-labelledby="hero-h"
      className={cn('relative', can3D ? 'h-[170vh]' : 'min-h-dvh')}
    >
      <div className="grain sticky top-0 flex min-h-dvh items-center overflow-hidden pt-28 pb-16">
        <div className="desk pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        {/* Prints landing on a board. On wide screens with a GPU the live 3D scene fades in over it. */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-full md:w-[64%]"
          aria-hidden
        >
          <img
            src="/media/hero.webp"
            alt=""
            width={1376}
            height={768}
            fetchPriority="high"
            className={cn(
              'h-full w-full object-cover transition-opacity duration-1000',
              can3D ? 'opacity-0' : 'opacity-75',
            )}
          />
          <div className="from-bg via-bg/70 absolute inset-0 bg-gradient-to-r to-transparent" />
          <div className="from-bg to-bg/30 absolute inset-0 bg-gradient-to-t via-transparent" />
        </div>
        {can3D && (
          <div
            className="pointer-events-none absolute inset-0 hidden md:left-[36%] md:block"
            aria-hidden
          >
            <Quiet>
              <Suspense fallback={null}>
                <Hero3D progress={progress} />
              </Suspense>
            </Quiet>
          </div>
        )}

        <div className="relative mx-auto w-full max-w-6xl px-6">
          <motion.p
            custom={0}
            initial={prerendered ? false : 'hidden'}
            animate="show"
            variants={fadeUp}
            className="spec border-line bg-bg/60 text-muted inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur"
          >
            <span className="bg-accent size-1.5 rounded-full" /> AI moodboards · real photos · free
          </motion.p>
          {/* Not animated: it is the LCP element and must paint straight from the prerendered HTML. */}
          <h1
            id="hero-h"
            className="font-display mt-6 max-w-3xl text-[clamp(3.4rem,9vw,7.5rem)] leading-[0.9]"
          >
            Describe a vibe.
            <br />
            <em className="text-accent-text">Get a direction.</em>
          </h1>
          <motion.p
            custom={2}
            initial={prerendered ? false : 'hidden'}
            animate="show"
            variants={fadeUp}
            className="text-muted mt-6 max-w-lg text-lg"
          >
            Pixe turns a sentence into a moodboard of real, credited photos from Unsplash, Pexels
            and Openverse, then pulls out the palette, pairs the fonts and writes the brief.
          </motion.p>
          <motion.form
            custom={3}
            initial={prerendered ? false : 'hidden'}
            animate="show"
            variants={fadeUp}
            onSubmit={(e) => void start(e)}
            className="border-line bg-surface/80 focus-within:border-accent-text mt-10 flex max-w-xl flex-col gap-2 rounded-3xl border p-2 backdrop-blur sm:flex-row sm:items-center sm:rounded-full"
          >
            <label htmlFor={inputId} className="sr-only">
              Describe a vibe
            </label>
            <input
              id={inputId}
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              maxLength={300}
              placeholder={VIBES[0]}
              className="placeholder:text-muted h-12 min-w-0 flex-1 bg-transparent px-4 outline-none"
            />
            <Button type="submit" variant="primary" size="lg">
              Build a board <ArrowRight />
            </Button>
          </motion.form>
          <motion.ul
            custom={4}
            initial={prerendered ? false : 'hidden'}
            animate="show"
            variants={fadeUp}
            className="mt-4 flex flex-wrap gap-1.5"
            aria-label="Try one"
          >
            {VIBES.slice(1).map((v) => (
              <li key={v}>
                <button
                  type="button"
                  onClick={() => setVibe(v)}
                  className="spec border-line text-muted hover:text-text rounded-full border px-3 py-1.5"
                >
                  {v}
                </button>
              </li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  )
}

const PULLS = [
  {
    icon: Droplets,
    title: 'The palette',
    body: 'Six swatches from every photo, merged into one board palette. On your device, no AI.',
    span: 'md:col-span-2',
    demo: <PaletteDemo />,
  },
  {
    icon: Type,
    title: 'Font pairings',
    body: 'Three Google Fonts pairings that suit the board, shown as live type cards.',
    demo: <TypeDemo />,
  },
  {
    icon: Contrast,
    title: 'Contrast checks',
    body: 'Every pair in the palette graded against WCAG AA and AAA before you ship it.',
    demo: <ContrastDemo />,
  },
  {
    icon: FileText,
    title: 'The brief',
    body: 'Mood, visual language, colour and type rules, and do and don’t, in one page of Markdown.',
    span: 'md:col-span-2',
    demo: <BriefDemo />,
  },
]

function PullsOut() {
  return (
    <section aria-labelledby="pulls-h" className="mx-auto max-w-6xl px-6 py-28">
      <p className="spec text-accent-text">What Pixe pulls out</p>
      <h2 id="pulls-h" className="font-display mt-3 max-w-3xl text-5xl leading-[0.95] md:text-7xl">
        A board is the start. <em>The direction</em> is what you hand over.
      </h2>
      <ul className="mt-14 grid gap-4 md:grid-cols-3">
        {PULLS.map((b, i) => (
          <motion.li
            key={b.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: i * 0.06, duration: 0.6 }}
            className={cn(
              'border-line bg-surface/60 relative overflow-hidden rounded-3xl border p-6',
              b.span,
            )}
          >
            <b.icon className="text-accent-text size-6" aria-hidden />
            <h3 className="font-display mt-4 text-3xl">{b.title}</h3>
            <p className="text-muted mt-2 max-w-sm text-sm">{b.body}</p>
            <div className="mt-6" aria-hidden>
              {b.demo}
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  )
}

const DEMO_PALETTE = ['#2b1d14', '#7a4b2a', '#c98a4b', '#e8d2b0', '#6b7a5a', '#d4ff3a']

function PaletteDemo() {
  return (
    <ul className="flex h-28 gap-1.5">
      {DEMO_PALETTE.map((c) => (
        <li key={c} className="print flex flex-1 flex-col p-1">
          <span className="flex-1" style={{ background: c }} />
          <span className="spec pt-1 text-[9px] text-[#2b2620]">{c}</span>
        </li>
      ))}
    </ul>
  )
}

function TypeDemo() {
  return (
    <div className="print p-4 text-[#2b2620]">
      <p className="font-display text-4xl">Aa</p>
      <p className="font-display text-lg italic">Instrument Serif</p>
      <p className="text-sm">Inter Tight: the quick brown fox</p>
    </div>
  )
}

function ContrastDemo() {
  return (
    <div className="flex gap-2">
      <span className="grid h-20 flex-1 place-items-center rounded-xl bg-[#e8d2b0] text-[#2b1d14]">
        <span className="text-center">
          <span className="block font-semibold">12.9</span>
          <span className="spec text-[10px]">AAA</span>
        </span>
      </span>
      <span className="grid h-20 flex-1 place-items-center rounded-xl bg-[#c98a4b] text-white">
        <span className="text-center">
          <span className="block font-semibold">2.76</span>
          <span className="spec text-[10px]">Fail</span>
        </span>
      </span>
    </div>
  )
}

function BriefDemo() {
  return (
    <div className="border-line bg-bg/60 rounded-2xl border p-4 text-sm">
      <p className="font-display text-xl">Mood</p>
      <p className="text-muted mt-1">
        Slow mornings and steamed milk. Warm, a little grainy, never polished.
      </p>
      <p className="font-display mt-3 text-xl">Colour</p>
      <p className="text-muted mt-1">
        Espresso brown as the base, oat as the paper, one acid-green accent for anything you tap.
      </p>
    </div>
  )
}

function Credits() {
  return (
    <section aria-labelledby="credits-h" className="border-line bg-surface/40 border-y py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <p className="spec text-accent-text">Real photos, properly credited</p>
          <h2 id="credits-h" className="font-display mt-3 text-5xl leading-[0.95]">
            Three free libraries. <em>Every</em> photographer named.
          </h2>
          <p className="text-muted mt-4 max-w-md">
            Pixe isn't a stock site. It never re-hosts a photo or passes off AI images as stock:
            each print links back to its photographer and licence, and Openverse photos show their
            Creative Commons terms.
          </p>
          <SourcesNote className="mt-6 max-w-md" />
        </div>
        <figure className="print mx-auto w-full max-w-sm rotate-[1.5deg]">
          <img
            src="/media/step-curate.webp"
            alt="Prints dropping onto a dark light table in a loose grid"
            width={720}
            height={720}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
          <figcaption className="spec px-1 pt-2 pb-1 text-[10px] text-[#2b2620]">
            Illustration · not a stock photo
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

const AI_ACTIONS = [
  { icon: Sparkles, title: 'Vibe → searches', body: 'Five varied queries from one sentence.' },
  { icon: ScanEye, title: 'Real alt text', body: 'Describes each photo for screen readers.' },
  { icon: Type, title: 'Font pairings', body: 'Google Fonts only, so you can use them.' },
  { icon: FileText, title: 'The brief', body: 'One page you can paste into a deck.' },
]

function AiSection({ reduce }: { reduce: boolean }) {
  return (
    <section aria-labelledby="ai-h" className="relative overflow-hidden py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2 md:items-center">
        <div>
          <p className="spec text-accent-text">The AI</p>
          <h2 id="ai-h" className="font-display mt-3 text-5xl leading-[0.95] md:text-6xl">
            A creative director on call, and <em>always free</em>.
          </h2>
          <p className="text-muted mt-6 max-w-md">
            Use our free server, or bring your own: Puter, OpenRouter or any OpenAI-compatible key.
            It only ever sees your words and public stock photos, never your uploads.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {AI_ACTIONS.map((a) => (
              <li key={a.title} className="border-line bg-surface/60 rounded-2xl border p-4">
                <a.icon className="text-accent-text size-5" aria-hidden />
                <h3 className="mt-2 font-medium">{a.title}</h3>
                <p className="text-muted mt-1 text-sm">{a.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <LoopVideo
          src="/media/hero"
          poster="/media/hero.webp"
          label="Photo prints drifting through the air and settling onto a floating dark board"
          reduce={reduce}
          className="print aspect-video w-full rotate-[-1deg]"
        />
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section aria-labelledby="pricing-h" className="mx-auto max-w-6xl px-6 py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="spec text-accent-text">Pricing</p>
          <h2 id="pricing-h" className="font-display mt-3 text-5xl md:text-6xl">
            Free to make.
          </h2>
          <p className="text-muted mt-4 max-w-md">
            Every feature above is free. Pro adds share links, brand-kit PDFs and sync, for all
            seven EW apps at once.
          </p>
        </div>
        <Button asChild>
          <Link to="/pro">
            Compare plans <ArrowRight />
          </Link>
        </Button>
      </div>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <li
            key={p.name}
            className={cn(
              'rounded-3xl border p-6',
              p.featured ? 'border-accent-text bg-accent/5' : 'border-line',
            )}
          >
            <p className="spec text-muted">Pro · {p.name}</p>
            <p className="mt-3">
              <span className="font-display text-5xl">{p.price}</span>{' '}
              <span className="text-muted">{p.per}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function DeveloperCard() {
  return (
    <section aria-labelledby="dev-h" className="mx-auto max-w-6xl px-6 pb-28">
      <Link
        to="/developer"
        className="group border-line bg-surface/60 hover:border-accent-text grid items-center gap-8 overflow-hidden rounded-3xl border p-6 transition-colors md:grid-cols-[auto_1fr_auto] md:p-8"
      >
        <img
          src="/media/developer.webp"
          alt="Emmanuel's 3D character"
          width={160}
          height={160}
          loading="lazy"
          className="print size-32 rotate-[-2deg] object-cover md:size-40"
        />
        <div>
          <p className="spec text-accent-text">Built by</p>
          <h2 id="dev-h" className="font-display mt-2 text-4xl">
            Emmanuel Wilson
          </h2>
          <p className="text-muted mt-2 max-w-md">
            Designer-developer behind EWSTUDIOS. Come and say hello.
          </p>
        </div>
        <ArrowRight
          className="text-muted group-hover:text-accent-text size-8 transition-transform group-hover:translate-x-1"
          aria-hidden
        />
      </Link>
    </section>
  )
}
