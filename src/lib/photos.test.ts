import { describe, expect, it } from 'vitest'
import { creditParts, creditText, mergeResults, type Photo } from './photos'

const photo = (id: string, over: Partial<Photo> = {}): Photo => ({
  id,
  source: 'unsplash',
  width: 100,
  height: 100,
  color: null,
  alt: '',
  thumb: '',
  src: '',
  pageUrl: `https://unsplash.com/photos/${id}`,
  author: { name: 'Ana Lee', url: 'https://unsplash.com/@ana' },
  license: null,
  downloadLocation: null,
  ...over,
})

describe('mergeResults', () => {
  it('interleaves sources and drops duplicates', () => {
    const merged = mergeResults([
      [photo('u1'), photo('u2'), photo('u3')],
      [photo('p1')],
      [photo('o1'), photo('u2')],
    ])
    expect(merged.map((p) => p.id)).toEqual(['u1', 'p1', 'o1', 'u2', 'u3'])
  })

  it('handles empty lists', () => {
    expect(mergeResults([])).toEqual([])
    expect(mergeResults([[], []])).toEqual([])
  })
})

describe('credits', () => {
  it('credits Unsplash with UTM links on the photographer and Unsplash', () => {
    const parts = creditParts(photo('u1'))
    expect(creditText(photo('u1'))).toBe('Photo by Ana Lee on Unsplash')
    expect(parts[1]?.href).toBe('https://unsplash.com/@ana?utm_source=pixe&utm_medium=referral')
    expect(parts[3]?.href).toBe('https://unsplash.com/?utm_source=pixe&utm_medium=referral')
  })

  it('credits Pexels with a link to the photo page', () => {
    const p = photo('p1', {
      source: 'pexels',
      pageUrl: 'https://www.pexels.com/photo/1/',
      author: { name: 'Bo Kim', url: 'https://www.pexels.com/@bo' },
    })
    expect(creditText(p)).toBe('Photo by Bo Kim on Pexels')
    expect(creditParts(p).at(-1)?.href).toBe('https://www.pexels.com/photo/1/')
  })

  it('credits Openverse with title, creator and licence', () => {
    const p = photo('o1', {
      source: 'openverse',
      alt: 'Forest',
      author: { name: 'barnyz', url: null },
      license: { name: 'CC BY 2.0', url: 'https://creativecommons.org/licenses/by/2.0/' },
    })
    expect(creditText(p)).toBe('“Forest” by barnyz, CC BY 2.0, via Openverse')
    expect(creditParts(p).find((c) => c.text === 'CC BY 2.0')?.href).toContain('creativecommons')
    expect(creditParts(p).find((c) => c.text === 'barnyz')?.href).toBeUndefined()
  })
})
