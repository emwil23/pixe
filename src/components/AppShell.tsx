import { cn } from '@/lib/cn'
import { Link, Outlet } from '@tanstack/react-router'
import { LayoutGrid, Palette, Search, Settings } from 'lucide-react'
import { Logo, LogoMark } from './Logo'
import { NewBoardDialog } from './NewBoardDialog'

const NAV = [
  { to: '/app', label: 'Boards', icon: LayoutGrid, exact: true },
  { to: '/app/discover', label: 'Discover', icon: Search, exact: false },
  { to: '/app/palette', label: 'Palette', icon: Palette, exact: false },
] as const

const navLink =
  'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:text-text [&.active]:bg-surface-2 [&.active]:text-text [&_svg]:size-4'

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="focus:bg-accent focus:text-accent-ink sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="border-line bg-bg/85 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-3 backdrop-blur-md sm:px-5">
        <Link to="/" aria-label="Pixe home" className="shrink-0">
          <Logo className="hidden sm:inline-flex" />
          <LogoMark className="sm:hidden" />
        </Link>
        <nav aria-label="App" className="flex items-center gap-0.5 sm:ml-4">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.exact }}
              className={navLink}
              aria-label={n.label}
            >
              <n.icon aria-hidden /> <span className="hidden md:inline">{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <NewBoardDialog openFromUrl />
          <Link to="/settings" className={cn(navLink, 'px-2')} aria-label="Settings">
            <Settings aria-hidden />
          </Link>
        </div>
      </header>
      <main id="main" className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
