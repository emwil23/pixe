import { describe, expect, it } from 'vitest'
import { pickDistinct } from './palette'

describe('pickDistinct', () => {
  it('keeps the most common colours and skips near-duplicates', () => {
    const picked = pickDistinct(
      [
        { name: 'a', hex: '#7a4b2a', population: 900 },
        { name: 'b', hex: '#7c4d2c', population: 800 }, // nearly the same brown
        { name: 'c', hex: '#f2e6d0', population: 500 },
        { name: 'd', hex: '#1d2b2a', population: 100 },
      ],
      3,
    )
    expect(picked.map((s) => s.name)).toEqual(['a', 'c', 'd'])
  })

  it('stops at the count', () => {
    const many = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'].map((hex, i) => ({
      name: hex,
      hex,
      population: 10 - i,
    }))
    expect(pickDistinct(many, 2)).toHaveLength(2)
  })
})
