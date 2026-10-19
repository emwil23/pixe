import { Link, Outlet } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { Logo } from './Logo'
import { Button } from './ui/button'

const links = [
  { to: '/', hash: 'how', label: 'How it works' },
  { to: '/pro', label: 'Pro' },
  { to: '/developer', label: 'Developer' },
] as const

export function SiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="focus:bg-accent focus:text-accent-ink sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="border-line/70 bg-bg/70 mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-6xl items-center justify-between rounded-full border px-4 py-2 backdrop-blur-md">
          <Link to="/" aria-label="Pixe home">
            <Logo />
          </Link>
          <nav aria-label="Site" className="hidden items-center gap-1 sm:flex">
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                {...('hash' in l && { hash: l.hash })}
                className="text-muted hover:text-text [&.active]:text-text rounded-lg px-3 py-1.5 text-sm"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Button asChild variant="primary" size="sm">
            <Link to="/app">Open Pixe</Link>
          </Button>
        </div>
      </header>
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export function Footer() {
  return (
    <footer className="border-line border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="text-muted mt-3 text-sm">
            AI moodboards for creative direction. Real, credited stock photos; open source.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
          <Link to="/app" className="text-muted hover:text-text">
            App
          </Link>
          <Link to="/pro" className="text-muted hover:text-text">
            Pro
          </Link>
          <Link to="/developer" className="text-muted hover:text-text">
            Meet the developer
          </Link>
          <Link to="/privacy" className="text-muted hover:text-text">
            Privacy
          </Link>
          <a href="https://github.com/emwil23/pixe" className="text-muted hover:text-text">
            Source on GitHub
          </a>
          <Link to="/terms" className="text-muted hover:text-text">
            Terms
          </Link>
        </nav>
      </div>
      <p className="spec border-line text-muted border-t py-5 text-center">
        Made with{' '}
        <Heart className="fill-accent-text text-accent-text inline size-3.5" aria-label="love" /> by
        EWSTUDIOS
      </p>
    </footer>
  )
}
