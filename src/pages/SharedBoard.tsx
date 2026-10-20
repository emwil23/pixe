import { EmptyState } from '@/components/EmptyState'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

/**
 * A read-only board someone shared with a link (Pro).
 * shortcut: share links need Pro checkout, which isn't live yet, so every link shows this page; build the
 * server-backed view when payments land.
 */
export function SharedBoard() {
  return (
    <main id="main" className="desk min-h-dvh">
      <header className="flex items-center justify-between p-4">
        <Link to="/" aria-label="Pixe home">
          <Logo />
        </Link>
        <Button asChild variant="primary" size="sm">
          <Link to="/app">Make your own board</Link>
        </Button>
      </header>
      <EmptyState art="/media/empty-board" title="This shared board isn't available.">
        Shared links arrive with Pixe Pro. Until then, boards live in the browser that made them;
        export one as a PNG to send it.
      </EmptyState>
    </main>
  )
}
