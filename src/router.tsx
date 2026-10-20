import { SiteLayout } from '@/components/SiteLayout'
import { NotFound } from '@/pages/NotFound'
import { useSettings, applyTheme } from '@/stores/settings'
import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { Toaster } from 'sonner'

function Root() {
  const theme = useSettings((s) => s.theme)
  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])
  return (
    <>
      <Outlet />
      <Toaster
        position="bottom-center"
        theme={theme === 'system' ? 'system' : theme}
        richColors
        closeButton
      />
    </>
  )
}

const root = createRootRoute({ component: Root, notFoundComponent: NotFound })

const site = createRoute({ getParentRoute: () => root, id: 'site', component: SiteLayout })
// The app shell is lazy too, so the landing page doesn't download the app.
const shell = createRoute({
  getParentRoute: () => root,
  id: 'shell',
  component: lazyRouteComponent(() => import('@/components/AppShell'), 'AppShell'),
})

const sitePages = [
  createRoute({
    getParentRoute: () => site,
    path: '/',
    component: lazyRouteComponent(() => import('@/pages/Landing'), 'Landing'),
  }),
  createRoute({
    getParentRoute: () => site,
    path: 'developer',
    component: lazyRouteComponent(() => import('@/pages/Developer'), 'Developer'),
  }),
  createRoute({
    getParentRoute: () => site,
    path: 'pro',
    component: lazyRouteComponent(() => import('@/pages/Pro'), 'Pro'),
  }),
  createRoute({
    getParentRoute: () => site,
    path: 'privacy',
    component: lazyRouteComponent(() => import('@/pages/Legal'), 'Privacy'),
  }),
  createRoute({
    getParentRoute: () => site,
    path: 'terms',
    component: lazyRouteComponent(() => import('@/pages/Legal'), 'Terms'),
  }),
]

const appPages = [
  createRoute({
    getParentRoute: () => shell,
    path: 'app',
    // ?new=1 opens the "Describe a vibe" dialog (PWA shortcut).
    validateSearch: (s: Record<string, unknown>): { new?: number } => (s.new ? { new: 1 } : {}),
    component: lazyRouteComponent(() => import('@/pages/Dashboard'), 'Dashboard'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/board/$boardId',
    validateSearch: (s: Record<string, unknown>): { build?: number } =>
      s.build ? { build: 1 } : {},
    component: lazyRouteComponent(() => import('@/pages/BoardPage'), 'BoardPage'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/discover',
    validateSearch: (s: Record<string, unknown>): { q?: string } =>
      typeof s.q === 'string' && s.q ? { q: s.q.slice(0, 100) } : {},
    component: lazyRouteComponent(() => import('@/pages/Discover'), 'Discover'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'app/palette',
    component: lazyRouteComponent(() => import('@/pages/PalettePage'), 'PalettePage'),
  }),
  createRoute({
    getParentRoute: () => shell,
    path: 'settings',
    component: lazyRouteComponent(() => import('@/pages/SettingsPage'), 'SettingsPage'),
  }),
]

// A shared board stands alone: no app chrome, read-only.
const shared = createRoute({
  getParentRoute: () => root,
  path: 'b/$shareId',
  component: lazyRouteComponent(() => import('@/pages/SharedBoard'), 'SharedBoard'),
})

const routeTree = root.addChildren([
  site.addChildren(sitePages),
  shell.addChildren(appPages),
  shared,
])

export const router = createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
