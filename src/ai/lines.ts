/**
 * Turns a stream of text chunks into JSON objects, one per complete line.
 * Models sometimes wrap output in ``` fences or add chatter; those lines are skipped.
 */
export async function* jsonLines<T>(chunks: AsyncIterable<string>): AsyncGenerator<T> {
  let buffer = ''
  for await (const chunk of chunks) {
    buffer += chunk
    if (buffer.includes('[[error]]')) throw new Error('The AI stopped partway. Please try again.')
    let nl: number
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const item = parseLine(buffer.slice(0, nl))
      buffer = buffer.slice(nl + 1)
      if (item !== undefined) yield item as T
    }
  }
  const last = parseLine(buffer)
  if (last !== undefined) yield last as T
}

function parseLine(line: string): unknown {
  const s = line.trim().replace(/,$/, '')
  if (!s.startsWith('{')) return undefined
  try {
    return JSON.parse(s) as unknown
  } catch {
    return undefined
  }
}
