// Takes the README screenshots in docs/ from the real app and real photo searches.
// Run ew-apps-api locally (npm run dev there), serve a build on an allowed origin
// (`npm run build && npx serve dist -c ../serve.json -l 5173`), then `node scripts/screenshots.mjs`.
// ANGLE on D3D11 uses the real GPU even headless, so the landing page's WebGL scene renders.
import { chromium, devices } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
const VIBE = process.env.VIBE ?? 'ceramic studio, linen, warm morning light'
const docs = (name) => new URL(`../docs/${name}.png`, import.meta.url).pathname.replace(/^\/(\w:)/, '$1')

const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu'] })

async function page(options = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    ...options,
  })
  const p = await ctx.newPage()
  return { ctx, p }
}

// Desktop, dark: one browser profile, so the board made here shows up on every app page.
const { ctx, p } = await page()

await p.goto(`${BASE}/`)
await p.waitForTimeout(5000) // the 3D scene loads when the page is idle
await p.screenshot({ path: docs('landing') })
await p.evaluate(() => window.scrollTo(0, document.querySelector('#how').offsetTop + 260))
await p.waitForTimeout(2500)
await p.screenshot({ path: docs('story') })

await p.goto(`${BASE}/app`)
await p.getByRole('button', { name: 'Describe a vibe' }).click()
await p.getByRole('textbox', { name: 'Vibe' }).fill(VIBE)
await p.getByRole('button', { name: 'Build the board' }).click()
await p.getByRole('list', { name: 'Board palette' }).waitFor({ timeout: 90_000 })
await p.waitForTimeout(4000) // let every print finish loading
await p.screenshot({ path: docs('board') })

await p.locator('[data-item-id]').nth(2).click()
await p.waitForTimeout(1500)
await p.screenshot({ path: docs('inspector') })

await p.getByRole('button', { name: 'List view' }).click()
await p.waitForTimeout(1500)
await p.screenshot({ path: docs('list-view') })

await p.getByRole('link', { name: 'Boards' }).click()
await p.waitForTimeout(2500)
await p.screenshot({ path: docs('dashboard') })

await p.goto(`${BASE}/app/discover?q=${encodeURIComponent(VIBE.split(',')[0])}`)
await p.getByRole('list', { name: 'Search results' }).getByRole('listitem').nth(6).waitFor({ timeout: 60_000 })
await p.waitForTimeout(4000)
await p.screenshot({ path: docs('discover') })

await p.goto(`${BASE}/app/palette`)
await p.getByLabel("Or use a board's palette").selectOption({ index: 1 })
await p.waitForTimeout(1000)
await p.screenshot({ path: docs('palette'), fullPage: true })

await p.goto(`${BASE}/developer`)
await p.waitForTimeout(3000)
await p.screenshot({ path: docs('developer') })
await ctx.close()

// Light theme board, from the same kind of build.
{
  const { ctx, p } = await page({ colorScheme: 'light' })
  await p.goto(`${BASE}/app`)
  await p.getByRole('button', { name: 'Describe a vibe' }).click()
  await p.getByRole('textbox', { name: 'Vibe' }).fill(VIBE)
  await p.getByRole('button', { name: 'Build the board' }).click()
  await p.getByRole('list', { name: 'Board palette' }).waitFor({ timeout: 90_000 })
  await p.waitForTimeout(4000)
  await p.screenshot({ path: docs('board-light') })
  await ctx.close()
}

// Phone.
{
  const { ctx, p } = await page({ ...devices['Pixel 7'], colorScheme: 'dark' })
  await p.goto(`${BASE}/`)
  await p.waitForTimeout(2500)
  await p.screenshot({ path: docs('mobile-landing') })
  await ctx.close()
}

await browser.close()
console.log('screenshots saved in docs/')
