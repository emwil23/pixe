import { hexToRgb, type NamedColor } from './color'

export interface Swatch extends NamedColor {
  /** How many pixels the colour stands for: bigger means more of the image. */
  population: number
}

const NAMES: Record<string, string> = {
  Vibrant: 'Vibrant',
  DarkVibrant: 'Dark vibrant',
  LightVibrant: 'Light vibrant',
  Muted: 'Muted',
  DarkMuted: 'Dark muted',
  LightMuted: 'Light muted',
}

/**
 * The six Vibrant swatches of one image, biggest first. Runs in the browser on a canvas, so the image must
 * allow CORS (the stock CDNs do; dropped files are blob: URLs). The library loads only when first needed.
 */
export async function extractSwatches(src: string): Promise<Swatch[]> {
  const { Vibrant } = await import('node-vibrant/browser')
  const palette = await Vibrant.from(src).maxColorCount(64).getPalette()
  return Object.entries(palette)
    .flatMap(([key, s]) =>
      s ? [{ name: NAMES[key] ?? key, hex: s.hex.toLowerCase(), population: s.population }] : [],
    )
    .sort((a, b) => b.population - a.population)
}

const distance = (a: string, b: string) => {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  // "Redmean" weighting: a cheap distance that tracks how different two colours look.
  const rm = (r1 + r2) / 2
  return Math.sqrt(
    (2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2,
  )
}

/**
 * A board palette from many images' swatches: the most common colours first, skipping any that look
 * too close to one already picked.
 */
export function pickDistinct(swatches: Swatch[], count = 6, minDistance = 90): Swatch[] {
  const picked: Swatch[] = []
  for (const s of [...swatches].sort((a, b) => b.population - a.population)) {
    if (picked.length >= count) break
    if (picked.every((p) => distance(p.hex, s.hex) >= minDistance)) picked.push(s)
  }
  return picked
}

/** A board palette from several images; images that can't be read are skipped. */
export async function boardPalette(srcs: string[], count = 6): Promise<Swatch[]> {
  const all = await Promise.allSettled(srcs.slice(0, 12).map(extractSwatches))
  return pickDistinct(
    all.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])),
    count,
  )
}
