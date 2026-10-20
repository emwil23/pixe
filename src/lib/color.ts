/** Colour maths for the palette tools. Runs on the device; no AI and no network. */

export type Rgb = [number, number, number]

export function hexToRgb(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m?.[1]) throw new Error(`Not a #rrggbb colour: ${hex}`)
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export const rgbToHex = ([r, g, b]: Rgb) =>
  `#${[r, g, b]
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`

/** WCAG 2.2 relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, 1 to 21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

export interface ContrastGrade {
  ratio: number
  /** Body text: AA needs 4.5, AAA 7. */
  aa: boolean
  aaa: boolean
  /** Large text (24px, or 18.66px bold) and UI parts: AA needs 3. */
  aaLarge: boolean
}

export function grade(fg: string, bg: string): ContrastGrade {
  // Round down to 2 places first, so 4.499 never shows as "4.5" and passes.
  const ratio = Math.floor(contrast(fg, bg) * 100) / 100
  return { ratio, aa: ratio >= 4.5, aaa: ratio >= 7, aaLarge: ratio >= 3 }
}

/** Black or white, whichever reads better on this colour. */
export const inkFor = (bg: string) =>
  contrast(bg, '#000000') >= contrast(bg, '#ffffff') ? '#000000' : '#ffffff'

// --- HSL and harmonies ---

export type Hsl = [number, number, number]

export function hexToHsl(hex: string): Hsl {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as Rgb
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l * 100]
  const s = d / (1 - Math.abs(2 * l - 1))
  const h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0)) * 60
      : max === g
        ? ((b - r) / d + 2) * 60
        : ((r - g) / d + 4) * 60
  return [h, s * 100, l * 100]
}

export function hslToHex([h, s, l]: Hsl): string {
  const sat = s / 100
  const lig = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(lig, 1 - lig)
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return rgbToHex([f(0) * 255, f(8) * 255, f(4) * 255])
}

const rotate = (hex: string, deg: number) => {
  const [h, s, l] = hexToHsl(hex)
  return hslToHex([(((h + deg) % 360) + 360) % 360, s, l])
}

export const HARMONIES = {
  complementary: [180],
  analogous: [-30, 30],
  triadic: [120, 240],
  'split complementary': [150, 210],
  tetradic: [90, 180, 270],
} as const
export type Harmony = keyof typeof HARMONIES

/** The base colour followed by its harmony partners (same saturation and lightness). */
export const harmony = (base: string, kind: Harmony) => [
  base.toLowerCase(),
  ...HARMONIES[kind].map((d) => rotate(base, d)),
]

// --- Export ---

export interface NamedColor {
  name: string
  hex: string
}

/** "Dark Vibrant" → "dark-vibrant". */
export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'color'

export const toCssVariables = (colors: NamedColor[]) =>
  `:root {\n${colors.map((c) => `  --${slug(c.name)}: ${c.hex};`).join('\n')}\n}\n`

/** Tailwind v4 reads theme colours from CSS. */
export const toTailwind = (colors: NamedColor[]) =>
  `@theme {\n${colors.map((c) => `  --color-${slug(c.name)}: ${c.hex};`).join('\n')}\n}\n`

/** W3C Design Tokens format, which Figma's variables import and Tokens Studio read. */
export const toDesignTokens = (colors: NamedColor[]) =>
  `${JSON.stringify(
    {
      color: Object.fromEntries(
        colors.map((c) => [slug(c.name), { $type: 'color', $value: c.hex }]),
      ),
    },
    null,
    2,
  )}\n`
