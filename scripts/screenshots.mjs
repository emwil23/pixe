// Takes the README screenshots in docs/ with realistic sample data.
// Run against a built app: `npm run build && npx serve dist -c ../serve.json -l 4173`, then `node scripts/screenshots.mjs`.
// ANGLE on D3D11 uses the real GPU even headless, so the landing page's WebGL scene renders.
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, devices } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
const docs = new URL('../docs/', import.meta.url)

const pad = (n) => String(n).padStart(2, '0')
const day = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const at = (offset, h, m) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

const projects = [
  { id: 'p-work', name: 'Portfolio launch', color: '#FF6B3D', createdAt: 1 },
  { id: 'p-health', name: 'Health', color: '#4ADE9A', createdAt: 2 },
  { id: 'p-home', name: 'Home', color: '#7CC4FF', createdAt: 3 },
]
let order = 0
const task = (t) => ({
  id: `t-${++order}`,
  notes: '',
  status: 'todo',
  priority: 4,
  projectId: null,
  scheduled: null,
  due: null,
  someday: false,
  estimateMin: null,
  quadrant: null,
  block: null,
  subtasks: [],
  order,
  createdAt: Date.now() - order * 60_000,
  completedAt: null,
  ...t,
})
const tasks = [
  task({
    title: 'Ship the TaskPilot case study',
    priority: 1,
    projectId: 'p-work',
    scheduled: day(0),
    due: day(0),
    estimateMin: 90,
    status: 'doing',
    block: { start: at(0, 9, 30), end: at(0, 11, 0) },
    subtasks: [
      { id: 's1', title: 'Record the 30s walkthrough', done: true },
      { id: 's2', title: 'Write the "Decisions" section', done: true },
      { id: 's3', title: 'Export screenshots at 2x', done: false },
      { id: 's4', title: 'Post it on LinkedIn', done: false },
    ],
  }),
  task({
    title: 'Reply to Sam about the API rate limits',
    priority: 2,
    projectId: 'p-work',
    scheduled: day(0),
    estimateMin: 15,
    block: { start: at(0, 11, 15), end: at(0, 11, 30) },
  }),
  task({
    title: 'Gym: push day',
    projectId: 'p-health',
    scheduled: day(0),
    estimateMin: 45,
    block: { start: at(0, 18, 0), end: at(0, 18, 45) },
  }),
  task({
    title: 'Book the dentist',
    priority: 3,
    projectId: 'p-health',
    scheduled: day(0),
    estimateMin: 10,
  }),
  task({
    title: 'Renew the domain before it lapses',
    priority: 1,
    due: day(-1),
    projectId: 'p-work',
    estimateMin: 5,
  }),
  task({
    title: 'Pay the electricity bill',
    priority: 2,
    projectId: 'p-home',
    scheduled: day(0),
    due: day(1),
    estimateMin: 5,
  }),
  task({
    title: 'Design review with Priya',
    priority: 2,
    projectId: 'p-work',
    scheduled: day(1),
    estimateMin: 60,
  }),
  task({ title: 'Plan the weekend trip', projectId: 'p-home', scheduled: day(2), estimateMin: 30 }),
  task({
    title: 'Write the monthly newsletter',
    priority: 3,
    projectId: 'p-work',
    scheduled: day(3),
    estimateMin: 120,
  }),
  task({ title: 'Fix the squeaky door', projectId: 'p-home', scheduled: day(5) }),
  task({ title: 'Learn the piano basics', someday: true }),
  task({ title: 'Read "Four Thousand Weeks"', someday: true }),
  task({ title: 'Idea: a CLI for quick add' }),
  task({ title: 'Look into Supabase realtime for sync' }),
  task({
    title: 'Morning run',
    status: 'done',
    completedAt: Date.now() - 3_600_000,
    scheduled: day(0),
    projectId: 'p-health',
  }),
  task({
    title: 'Inbox zero',
    status: 'done',
    completedAt: Date.now() - 7_200_000,
    scheduled: day(0),
  }),
  task({
    title: 'Update the README badges',
    status: 'done',
    completedAt: Date.now() - 86_400_000,
    projectId: 'p-work',
  }),
]
const habits = [
  { id: 'h1', name: 'Read 20 pages', days: [-6, -5, -4, -3, -2, -1].map(day), createdAt: 1 },
  { id: 'h2', name: 'Walk 8,000 steps', days: [-4, -3, -2, -1, 0].map(day), createdAt: 2 },
  { id: 'h3', name: 'No phone after 22:00', days: [-6, -4, -2].map(day), createdAt: 3 },
]
const focus = [
  { id: 'f1', taskId: 't-1', day: day(0), minutes: 25, endedAt: Date.now() - 4_000_000 },
  { id: 'f2', taskId: 't-1', day: day(0), minutes: 25, endedAt: Date.now() - 2_000_000 },
]
const backup = join(tmpdir(), 'taskpilot-sample.json')
await writeFile(
  backup,
  JSON.stringify({ app: 'taskpilot', version: 1, tasks, projects, habits, focus }),
)

const browser = await chromium.launch({
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu'],
})

async function session(theme, options = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: theme,
    ...options,
  })
  await context.addInitScript((t) => {
    localStorage.setItem(
      'taskpilot-settings',
      JSON.stringify({ state: { theme: t, onboarded: true, provider: 'puter' }, version: 0 }),
    )
  }, theme)
  const page = await context.newPage()
  await page.goto(`${BASE}/settings`)
  await page.locator('input[type=file]').setInputFiles(backup)
  await page.getByText(/Imported \d+ items/).waitFor()
  return page
}

const shot = async (page, name, path, prep) => {
  await page.goto(`${BASE}${path}`)
  await page.getByRole('heading', { level: 1 }).first().waitFor()
  await page.waitForTimeout(600)
  if (prep) await prep(page)
  await page.screenshot({ path: new URL(`${name}.png`, docs).pathname.slice(1) })
  console.log('saved', name)
}

const dark = await session('dark')
await shot(dark, 'landing', '/', async (p) => {
  await p.mouse.move(1000, 400)
  await p.waitForTimeout(3500)
})
await shot(dark, 'flight-path', '/', async (p) => {
  await p.mouse.wheel(0, 1400)
  await p.waitForTimeout(1800)
})
await shot(dark, 'today', '/app/today')
await shot(dark, 'quick-add', '/app/today', async (p) => {
  await p.keyboard.press('q')
  await p.getByLabel('Task', { exact: true }).fill('Call mom tomorrow at 5pm p1 #Home ~30m')
})
await shot(dark, 'detail', '/app/today', async (p) => {
  await p.getByRole('button', { name: 'Ship the TaskPilot case study' }).click()
  await p.waitForTimeout(400)
})
await shot(dark, 'palette', '/app/today', async (p) => {
  await p.keyboard.press('Control+k')
  await p.getByPlaceholder(/search tasks/i).fill('pla')
})
await shot(dark, 'board', '/app/board')
await shot(dark, 'calendar', '/app/calendar')
await shot(dark, 'matrix', '/app/matrix')
await shot(dark, 'focus', '/app/focus')
await shot(dark, 'developer', '/developer', async (p) => p.waitForTimeout(2000))

const light = await session('light')
await shot(light, 'today-light', '/app/today')

const phone = await session('dark', {
  ...devices['Pixel 7'],
  viewport: devices['Pixel 7'].viewport,
})
await shot(phone, 'mobile-today', '/app/today')
await shot(phone, 'mobile-landing', '/')

await browser.close()
