import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

// The app is built with VITE_API_URL=http://api.test (playwright.config.ts); every API call and photo is
// answered here, so the tests need no keys and no network.
const IMAGE = readFileSync(new URL('../public/media/tile-1.webp', import.meta.url))
type Source = 'unsplash' | 'openverse'

const photo = (source: Source, n: number, q: string) => ({
  id: `${source}:${q}-${n}`,
  source,
  width: 800,
  height: n % 2 ? 1000 : 600,
  color: '#7a4b2a',
  alt: `${q} ${n}`,
  thumb: `http://img.test/${source}-${n}.webp`,
  src: `http://img.test/${source}-${n}.webp`,
  pageUrl: `https://example.com/${source}/${n}`,
  author: { name: `${source} author ${n}`, url: `https://example.com/@${source}${n}` },
  license:
    source === 'openverse'
      ? { name: 'CC BY 2.0', url: 'https://creativecommons.org/licenses/by/2.0/' }
      : null,
  downloadLocation: source === 'unsplash' ? `https://api.unsplash.com/photos/${n}/download` : null,
})

async function mockApi(page: Page) {
  await page.route('http://api.test/api/photos/*/search*', (route) => {
    const url = new URL(route.request().url())
    const source = url.pathname.split('/')[3] as Source
    const q = url.searchParams.get('q') ?? ''
    return route.fulfill({
      json: { photos: [1, 2, 3].map((n) => photo(source, n, q)), hasMore: false },
      headers: { 'access-control-allow-origin': '*' },
    })
  })
  await page.route('http://api.test/api/photos/unsplash/download', (route) =>
    route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }),
  )
  await page.route('http://img.test/**', (route) =>
    route.fulfill({
      body: IMAGE,
      contentType: 'image/webp',
      headers: { 'access-control-allow-origin': '*' },
    }),
  )
}

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('landing tells the story and links into the app @mobile', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Describe a vibe')
  await expect(page.getByText('Made with')).toContainText('EWSTUDIOS')
  await expect(page.getByRole('heading', { name: /four moves/i })).toBeVisible()
  await page.getByRole('link', { name: 'Open Pixe' }).click()
  await expect(page).toHaveURL(/\/app$/)
  await expect(page.getByRole('heading', { name: /light table is empty/i })).toBeVisible()
})

test('vibe → board → palette export', async ({ page }) => {
  await page.goto('/app')
  await page.getByRole('button', { name: 'Describe a vibe' }).click()
  await page.getByRole('textbox', { name: 'Vibe' }).fill('cozy autumn café, film grain')
  await page.getByRole('button', { name: 'Build the board' }).click()

  // Without an AI provider the vibe's own phrases are the searches: 2 queries × 3 photos each, deduped.
  await expect(page).toHaveURL(/\/app\/board\//)
  const prints = page.locator('[data-item-id]')
  await expect(prints).toHaveCount(6)
  await expect(page.getByRole('list', { name: 'Board palette' })).toBeVisible()

  // The list view shows every photo with its credit.
  await page.getByRole('button', { name: 'List view' }).click()
  const list = page.getByRole('list', { name: 'Board items' })
  await expect(list.getByText('Photo by unsplash author 1 on Unsplash').first()).toBeVisible()
  await expect(list.getByText(/via Openverse/).first()).toBeVisible()
  await page.getByRole('button', { name: 'List view' }).click()

  // Export the board's palette as CSS variables from the Palette page.
  await page.getByRole('link', { name: 'Palette' }).click()
  await page.getByLabel("Or use a board's palette").selectOption({ label: 'Cozy autumn café' })
  await expect(page.getByRole('tabpanel', { name: 'CSS variables' })).toContainText('--colour-1: #')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /Download palette.css/ }).click()
  expect((await download).suggestedFilename()).toBe('palette.css')
})

test('board items move with the keyboard', async ({ page }) => {
  await page.goto('/app')
  await page.getByRole('button', { name: 'Describe a vibe' }).click()
  await page.getByRole('textbox', { name: 'Vibe' }).fill('linen')
  await page.getByRole('button', { name: 'Build the board' }).click()
  const first = page.locator('[data-item-id]').first()
  await expect(first).toBeVisible()
  const left = async () =>
    Number(/left: (-?\d+)px/.exec((await first.getAttribute('style')) ?? '')?.[1])
  const before = await left()
  await first.focus()
  await page.keyboard.press('Shift+ArrowRight')
  await expect.poll(left).toBe(before + 40)
  await expect(page.getByRole('tab', { name: 'Selected' })).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Delete')
  await expect(page.locator('[data-item-id]')).toHaveCount(2)
})

test('discover merges every source and adds to a board', async ({ page }) => {
  await page.goto('/app/discover?q=ceramics')
  const results = page.getByRole('list', { name: 'Search results' })
  await expect(results.getByRole('listitem')).toHaveCount(6)
  await results
    .getByRole('button', { name: /Add to board: ceramics 1/ })
    .first()
    .click()
  await expect(page.getByText(/Added to/)).toBeVisible()
})

const PAGES = [
  '/',
  '/developer',
  '/pro',
  '/privacy',
  '/terms',
  '/app',
  '/app/discover?q=dunes',
  '/app/palette',
  '/settings',
  '/b/abc',
  '/nowhere',
]

for (const path of PAGES) {
  for (const theme of ['dark', 'light'] as const) {
    test(`axe: ${path} (${theme}) has no violations`, async ({ page }) => {
      await page.addInitScript(
        (t) =>
          localStorage.setItem(
            'pixe-settings',
            JSON.stringify({ state: { theme: t }, version: 0 }),
          ),
        theme,
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(
        results.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
        ),
      ).toEqual([])
    })
  }
}
