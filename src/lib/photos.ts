/** The photo shape from ew-apps-api (`src/photos.ts` there); every source is normalised to it. */
export type Source = 'unsplash' | 'pexels' | 'openverse'
export const SOURCES: Source[] = ['unsplash', 'pexels', 'openverse']

export const SOURCE_NAME: Record<Source, string> = {
  unsplash: 'Unsplash',
  pexels: 'Pexels',
  openverse: 'Openverse',
}

export interface Photo {
  id: string
  source: Source
  width: number
  height: number
  color: string | null
  alt: string
  thumb: string
  src: string
  pageUrl: string
  author: { name: string; url: string | null }
  license: { name: string; url: string } | null
  downloadLocation: string | null
}

export interface PhotoQuery {
  q: string
  page?: number
  orientation?: 'landscape' | 'portrait' | 'square' | undefined
  color?: PhotoColor | undefined
  license?: 'any' | 'commercial' | 'modification' | undefined
}

export const PHOTO_COLORS = [
  'black',
  'white',
  'yellow',
  'orange',
  'red',
  'purple',
  'pink',
  'green',
  'teal',
  'blue',
] as const
export type PhotoColor = (typeof PHOTO_COLORS)[number]

export interface PhotoPage {
  photos: Photo[]
  hasMore: boolean
}

const API_URL = import.meta.env.VITE_API_URL as string | undefined
export const photosConfigured = Boolean(API_URL)

export class SourceError extends Error {
  constructor(
    readonly source: Source,
    readonly unavailable: boolean,
  ) {
    super(unavailable ? `${SOURCE_NAME[source]} is not available right now.` : 'Search failed.')
  }
}

export async function searchSource(
  source: Source,
  query: PhotoQuery,
  signal?: AbortSignal,
): Promise<PhotoPage> {
  if (!API_URL) throw new SourceError(source, true)
  const params = new URLSearchParams({ q: query.q, page: String(query.page ?? 1) })
  if (query.orientation) params.set('orientation', query.orientation)
  if (query.color) params.set('color', query.color)
  if (query.license && query.license !== 'any') params.set('license', query.license)
  const res = await fetch(`${API_URL}/api/photos/${source}/search?${params.toString()}`, {
    ...(signal && { signal }),
  })
  if (!res.ok) throw new SourceError(source, res.status === 503 || res.status === 429)
  return (await res.json()) as PhotoPage
}

/**
 * Interleaves each source's results (1st of each, then 2nd of each…) so no source dominates the top of
 * the grid, and drops duplicates by id.
 */
export function mergeResults(lists: Photo[][]): Photo[] {
  const seen = new Set<string>()
  const out: Photo[] = []
  const longest = Math.max(0, ...lists.map((l) => l.length))
  for (let i = 0; i < longest; i++)
    for (const list of lists) {
      const p = list[i]
      if (p && !seen.has(p.id)) {
        seen.add(p.id)
        out.push(p)
      }
    }
  return out
}

/**
 * Searches every source at once. A source that fails is reported in `failed` and the rest still show.
 */
export async function searchAll(
  query: PhotoQuery,
  sources: Source[] = SOURCES,
  signal?: AbortSignal,
  /** Called as each source answers, with everything so far, so slow sources don't hold up the rest. */
  onPartial?: (photos: Photo[]) => void,
): Promise<{ photos: Photo[]; hasMore: boolean; failed: Source[] }> {
  const lists: Photo[][] = sources.map(() => [])
  const results = await Promise.allSettled(
    sources.map((s, i) =>
      searchSource(s, query, signal).then((page) => {
        lists[i] = page.photos
        if (!signal?.aborted) onPartial?.(mergeResults(lists))
        return page
      }),
    ),
  )
  const failed = sources.filter((_, i) => results[i]?.status === 'rejected')
  const pages = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  return {
    photos: mergeResults(pages.map((p) => p.photos)),
    hasMore: pages.some((p) => p.hasMore),
    failed,
  }
}

const UTM = 'utm_source=pixe&utm_medium=referral'
const withUtm = (url: string) => `${url}${url.includes('?') ? '&' : '?'}${UTM}`

export interface CreditPart {
  text: string
  href?: string
}

/**
 * The credit each source asks for, as text parts with links:
 * Unsplash "Photo by X on Unsplash" (UTM links), Pexels "Photo by X on Pexels",
 * Openverse "“Title” by X, CC BY 2.0, via Openverse" (with the licence linked).
 */
export function creditParts(p: Photo): CreditPart[] {
  const author: CreditPart = { text: p.author.name, ...(p.author.url && { href: p.author.url }) }
  switch (p.source) {
    case 'unsplash':
      return [
        { text: 'Photo by ' },
        { ...author, ...(p.author.url && { href: withUtm(p.author.url) }) },
        { text: ' on ' },
        { text: 'Unsplash', href: withUtm('https://unsplash.com/') },
      ]
    case 'pexels':
      return [{ text: 'Photo by ' }, author, { text: ' on ' }, { text: 'Pexels', href: p.pageUrl }]
    case 'openverse':
      return [
        ...(p.alt
          ? [{ text: `“${p.alt}”`, href: p.pageUrl }, { text: ' by ' }]
          : [{ text: 'By ' }]),
        author,
        { text: ', ' },
        p.license ? { text: p.license.name, href: p.license.url } : { text: 'CC licence' },
        { text: ', via ' },
        { text: 'Openverse', href: 'https://openverse.org/' },
      ]
  }
}

/** The credit as plain text, for exports and the brand kit. */
export const creditText = (p: Photo) =>
  creditParts(p)
    .map((c) => c.text)
    .join('')

/**
 * For an <img onError>: Openverse's thumbnail service sometimes fails, so try the original once.
 * The original can be several MB, which is why it isn't the first choice.
 */
export function fallBackToOriginal(img: HTMLImageElement, p: Photo) {
  if (img.src !== p.src) img.src = p.src
}

/** Unsplash asks to be told whenever a photo is downloaded or exported. Fire and forget. */
export function trackDownload(p: Photo) {
  if (!API_URL || p.source !== 'unsplash' || !p.downloadLocation) return
  void fetch(`${API_URL}/api/photos/unsplash/download`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ downloadLocation: p.downloadLocation }),
  }).catch(() => undefined)
}
