import { describe, expect, it } from 'vitest'
import {
  contrast,
  grade,
  harmony,
  hexToHsl,
  hslToHex,
  inkFor,
  toCssVariables,
  toDesignTokens,
  toTailwind,
} from './color'

describe('contrast', () => {
  it('matches the WCAG reference values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#ffffff', '#ffffff')).toBe(1)
    // #767676 on white is the classic "just passes AA" grey.
    expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 2)
    expect(contrast('#ffffff', '#767676')).toBe(contrast('#767676', '#ffffff'))
  })

  it('grades without rounding a fail up to a pass', () => {
    expect(grade('#777777', '#ffffff')).toMatchObject({ aa: false, aaLarge: true })
    expect(grade('#767676', '#ffffff')).toMatchObject({ ratio: 4.54, aa: true, aaa: false })
    expect(grade('#000000', '#ffffff')).toMatchObject({ aa: true, aaa: true })
  })

  it('picks readable ink', () => {
    expect(inkFor('#d4ff3a')).toBe('#000000')
    expect(inkFor('#0e0d0c')).toBe('#ffffff')
  })

  it('rejects malformed colours', () => {
    expect(() => contrast('red', '#fff')).toThrow()
  })
})

describe('harmonies', () => {
  it('round-trips HSL', () => {
    for (const hex of ['#d4ff3a', '#0e0d0c', '#7a4b2a', '#ffffff', '#3366cc'])
      expect(hslToHex(hexToHsl(hex))).toBe(hex)
  })

  it('rotates hue around the wheel', () => {
    expect(harmony('#ff0000', 'complementary')).toEqual(['#ff0000', '#00ffff'])
    expect(harmony('#ff0000', 'triadic')).toEqual(['#ff0000', '#00ff00', '#0000ff'])
    expect(harmony('#FF0000', 'analogous')[0]).toBe('#ff0000')
  })
})

describe('export', () => {
  const colors = [
    { name: 'Dark Vibrant', hex: '#5a2e14' },
    { name: 'Light muted', hex: '#e8d9c4' },
  ]
  it('writes CSS variables, Tailwind theme and design tokens', () => {
    expect(toCssVariables(colors)).toBe(
      ':root {\n  --dark-vibrant: #5a2e14;\n  --light-muted: #e8d9c4;\n}\n',
    )
    expect(toTailwind(colors)).toContain('--color-dark-vibrant: #5a2e14;')
    expect(JSON.parse(toDesignTokens(colors))).toEqual({
      color: {
        'dark-vibrant': { $type: 'color', $value: '#5a2e14' },
        'light-muted': { $type: 'color', $value: '#e8d9c4' },
      },
    })
  })
})
