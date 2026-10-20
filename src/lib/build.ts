import { jsonLines } from '@/ai/lines'
import { providerById } from '@/ai/providers'
import type { ActionOutputs } from '@/ai/actions'
import { useSettings } from '@/stores/settings'
import { addPhotos, touch } from './board'
import { db } from './db'
import { boardPalette } from './palette'
import { mergeResults, searchAll, type Photo } from './photos'

/** Without AI, the vibe's own phrases are the queries: "cozy autumn café, film grain" → two searches. */
export function fallbackQueries(vibe: string): string[] {
  const parts = vibe
    .split(/[,;\n]| and /)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
  return [...new Set(parts.length ? parts : [vibe.trim()])].slice(0, 5)
}

export type BuildStep =
  | { step: 'queries'; queries: string[]; ai: boolean }
  | { step: 'search'; found: number }
  | { step: 'palette'; palette: string[] }
  | { step: 'done' }

async function aiQueries(vibe: string, signal: AbortSignal): Promise<string[] | null> {
  const provider = providerById(useSettings.getState().provider)
  if (!provider || !(await provider.ready())) return null
  try {
    const out: string[] = []
    for await (const line of jsonLines<ActionOutputs['queries']>(
      provider.run('queries', { vibe }, signal),
    ))
      if (typeof line.query === 'string' && line.query.trim()) out.push(line.query.trim())
    return out.length ? out.slice(0, 6) : null
  } catch {
    // The AI is a bonus here: the board still builds from the vibe's own words.
    return null
  }
}

/**
 * Builds a board from its vibe: AI-expanded queries (or the vibe's phrases), every source searched at
 * once, about 15 photos laid out as masonry, then the palette from those photos.
 */
export async function buildBoard(
  boardId: string,
  onStep: (s: BuildStep) => void,
  signal: AbortSignal,
  perQuery = 3,
) {
  const board = await db.boards.get(boardId)
  if (!board?.vibe) return
  const fromAi = await aiQueries(board.vibe, signal)
  const queries = fromAi ?? fallbackQueries(board.vibe)
  onStep({ step: 'queries', queries, ai: Boolean(fromAi) })

  const results = await Promise.all(
    queries.map((q) =>
      // A source still searching after 12s is left out, so one slow library doesn't stall the board.
      searchAll(
        { q },
        useSettings.getState().sources,
        AbortSignal.any([signal, AbortSignal.timeout(12_000)]),
      )
        .then((r) => r.photos.slice(0, perQuery))
        .catch(() => [] as Photo[]),
    ),
  )
  const photos = mergeResults(results).slice(0, 18)
  signal.throwIfAborted()
  await addPhotos(boardId, photos)
  onStep({ step: 'search', found: photos.length })

  const palette = (await boardPalette(photos.map((p) => p.thumb))).map((s) => s.hex)
  signal.throwIfAborted()
  await touch(boardId, { palette })
  onStep({ step: 'palette', palette })
  onStep({ step: 'done' })
}
