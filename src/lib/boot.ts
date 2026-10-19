import { useSyncExternalStore } from 'react'

/**
 * True when the page arrived with prerendered HTML (scripts/prerender.mjs) and React hydrates it, or while
 * that prerender runs. Entrance animations are skipped then, so the static HTML is never invisible.
 */
export const prerendered =
  Boolean(document.getElementById('root')?.firstElementChild) ||
  new URLSearchParams(location.search).has('prerender')

const query = matchMedia('(prefers-reduced-motion: reduce)')
const subscribe = (onChange: () => void) => {
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * Reduced-motion preference that is safe to hydrate: during hydration it reports `true`, which is how the
 * pages were prerendered, then switches to the real value. A mismatch would make React throw the DOM away.
 */
export const useReducedMotionSafe = () =>
  useSyncExternalStore(
    subscribe,
    () => query.matches,
    () => true,
  )
