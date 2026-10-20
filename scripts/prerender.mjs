// Renders the public pages to static HTML after `vite build`, so phones see content before the JS arrives.
// React then takes over with createRoot (see src/main.tsx, which waits for the route to load first).
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { preview } from 'vite'

// Only the public pages: app views come from IndexedDB, so their HTML can't be known ahead of time.
const ROUTES = ['/', '/developer', '/pro', '/privacy', '/terms']
const dist = new URL('../dist/', import.meta.url)

// shell/index.html is the untouched shell (emitted by vite.config.ts); index.html gets overwritten below.
const shell = await readFile(new URL('shell/index.html', dist), 'utf8')
// Cloudflare Pages serves 404.html for unknown paths; the router renders the 404 page into it.
await writeFile(new URL('404.html', dist), shell)

// The page is fully readable from the HTML, so start the app's JS once the page has loaded instead of
// competing with the first paint. Hydration then attaches to the same DOM.
const entry = shell.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/)?.[1]
if (!entry) throw new Error('Entry script not found in shell/index.html')
const template = shell
  .replace(/\s*<link rel="modulepreload"[^>]*>/g, '')
  .replace(
    /<script type="module" crossorigin src="[^"]+"><\/script>/,
    // After the load event, so the app's JS never shares the network with the first paint.
    `<script type="module">const go = () => import('${entry}'); document.readyState === 'complete' ? go() : addEventListener('load', go)</script>`,
  )

const server = await preview({ preview: { port: 4179, strictPort: true }, logLevel: 'silent' })
const browser = await chromium.launch()
// Reduced motion gives the static layout (no WebGL, pinned scroll or smooth scroll); hydration starts from it.
const page = await browser.newPage({
  reducedMotion: 'reduce',
  viewport: { width: 1440, height: 900 },
})

for (const route of ROUTES) {
  await page.goto(`http://localhost:4179${route}?prerender`)
  const html = await (await page.waitForFunction(() => window.__prerendered)).jsonValue()
  const title = await page.title()
  const out = template
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
  const dir = new URL(route === '/' ? './' : `.${route}/`, dist)
  await mkdir(dir, { recursive: true })
  await writeFile(new URL('index.html', dir), out)
  console.log(`prerendered ${route} (${Math.round(html.length / 1024)} kB)`)
}

await browser.close()
await new Promise((resolve) => server.httpServer.close(resolve))
