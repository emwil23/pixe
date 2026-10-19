import { describe, expect, it } from 'vitest'
import { jsonLines } from './lines'

async function* from(...chunks: string[]) {
  for (const c of chunks) yield c
}

async function collect<T>(it: AsyncIterable<T>) {
  const out: T[] = []
  for await (const x of it) out.push(x)
  return out
}

describe('jsonLines', () => {
  it('yields objects split across chunks', async () => {
    const out = await collect(jsonLines(from('{"a":', '1}\n{"a"', ':2}')))
    expect(out).toEqual([{ a: 1 }, { a: 2 }])
  })

  it('skips code fences, chatter and broken lines', async () => {
    const out = await collect(jsonLines(from('```json\n{"a":1},\nSure!\n{"a":\n```')))
    expect(out).toEqual([{ a: 1 }])
  })

  it('throws on the server error marker', async () => {
    await expect(collect(jsonLines(from('{"a":1}\n', '\n[[error]]\n')))).rejects.toThrow(/stopped/)
  })
})
