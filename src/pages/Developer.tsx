import { useReducedMotionSafe } from '@/lib/boot'
import { LoopVideo } from '@/components/LoopVideo'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, Globe } from 'lucide-react'

const LINKS = [
  {
    href: 'https://emmanuelwilson.tech',
    label: 'Portfolio',
    handle: 'emmanuelwilson.tech',
    icon: Globe,
  },
  { href: 'https://github.com/emwil23', label: 'GitHub', handle: 'emwil23', icon: GitHubIcon },
  {
    href: 'https://linkedin.com/in/ewilly',
    label: 'LinkedIn',
    handle: 'in/ewilly',
    icon: LinkedInIcon,
  },
  {
    href: 'https://instagram.com/iam_e.w',
    label: 'Instagram',
    handle: '@iam_e.w',
    icon: InstagramIcon,
  },
]

const STACK = [
  'React 19',
  'TypeScript',
  'TanStack Router',
  'Dexie',
  'Three.js / R3F',
  'node-vibrant',
  'GSAP',
  'Hono',
  'Supabase',
  'Gemini',
]

export function Developer() {
  const reduce = useReducedMotionSafe()
  return (
    <div className="relative overflow-hidden">
      <div className="desk pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pt-36 pb-20 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="spec text-accent-text">Meet the developer</p>
          <h1 className="font-display mt-4 text-6xl leading-[0.95] md:text-8xl">
            Hi, I'm Emmanuel.
          </h1>
          <p className="text-muted mt-6 max-w-lg text-lg">
            I design and build products end to end, from the 3D landing page to the API that keeps
            the keys safe. Pixe started in 2021 as a photo search exercise; this is what it became
            when I rebuilt it as a real creative tool.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Stack used in Pixe">
            {STACK.map((s) => (
              <li key={s} className="spec border-line text-muted rounded-full border px-3 py-1.5">
                {s}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild variant="primary" size="lg">
              <a href="https://emmanuelwilson.tech">
                See my work <ArrowUpRight />
              </a>
            </Button>
            <Button asChild size="lg">
              <a href="https://github.com/emwil23/pixe">Read the code</a>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div
            className="from-accent/25 absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br via-transparent to-[#ff5a36]/25 blur-2xl"
            aria-hidden
          />
          <LoopVideo
            src="/media/developer-loop"
            poster="/media/developer-poster.webp"
            label="Emmanuel's 3D character pinning a print to a moodboard wall, then smiling at the camera"
            reduce={reduce}
            eagerPoster
            className="print relative aspect-[4/5] w-full rotate-[-1.5deg]"
          />
          <span className="spec border-line bg-surface absolute -bottom-4 left-6 rounded-full border px-3 py-1.5">
            Art director · EWSTUDIOS
          </span>
        </div>
      </section>

      <section aria-labelledby="contact-h" className="relative mx-auto max-w-6xl px-6 pb-28">
        <h2 id="contact-h" className="font-display mb-6 text-4xl">
          Say hello
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LINKS.map(({ href, label, handle, icon: Icon }) => (
            <li key={href}>
              <a
                href={href}
                className="group border-line bg-surface/60 hover:border-accent-text flex items-center gap-4 rounded-2xl border p-5 transition-colors"
              >
                <Icon className="text-muted group-hover:text-accent-text-text size-6" aria-hidden />
                <span>
                  <span className="block font-medium">{label}</span>
                  <span className="spec text-muted">{handle}</span>
                </span>
                <ArrowUpRight className="text-muted ml-auto size-4" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function GitHubIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}

function LinkedInIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

function InstagramIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}
