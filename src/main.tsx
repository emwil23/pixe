import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { prerendered } from './lib/boot'
import { router } from './router'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root')

const app = (
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)

// Load the route's code first, so the first render never suspends.
await router.load()

if (new URLSearchParams(location.search).has('prerender')) {
  // Build step only (scripts/prerender.mjs): React's own server render, so hydration markers are right.
  const { renderToString } = await import('react-dom/server')
  Object.assign(window, { __prerendered: renderToString(app) })
} else if (prerendered) hydrateRoot(root, app)
else createRoot(root).render(app)
