import { LogoMark } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

/** A designed 404: an empty light table with one print lying face down. */
export function NotFound() {
  return (
    <main
      id="main"
      className="desk grain relative grid min-h-dvh place-items-center overflow-hidden px-6 text-center"
    >
      <div
        aria-hidden
        className="print pointer-events-none absolute top-1/2 left-1/2 h-72 w-56 -translate-x-1/2 -translate-y-1/2 rotate-[8deg] opacity-25"
      >
        <div className="bg-surface-2 size-full" />
      </div>
      <div className="relative">
        <LogoMark className="mx-auto mb-8 size-12" />
        <p className="spec text-accent-text">Error 404 · Underexposed</p>
        <h1 className="font-display mt-4 text-6xl md:text-9xl">
          This frame <em>didn't</em> develop.
        </h1>
        <p className="text-muted mx-auto mt-4 max-w-md">
          There's nothing on this part of the light table. Let's get you back to your boards.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="primary" size="lg">
            <Link to="/app">Back to boards</Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
