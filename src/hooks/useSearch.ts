import { mergeResults, searchAll, type Photo, type PhotoQuery, type Source } from '@/lib/photos'
import { useCallback, useEffect, useRef, useState } from 'react'

/** Searches every chosen source, page by page, merging the results as they come. */
export function useSearch(query: Omit<PhotoQuery, 'page'>, sources: Source[]) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [failed, setFailed] = useState<Source[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const page = useRef(1)
  // Everything from the pages loaded so far; the next page merges onto it.
  const loaded = useRef<Photo[]>([])
  const abort = useRef<AbortController | null>(null)
  const key = JSON.stringify([query, sources])

  const load = useCallback(
    async (next: number) => {
      const q = query.q.trim()
      if (!q) return
      abort.current?.abort()
      const ctrl = new AbortController()
      abort.current = ctrl
      setLoading(true)
      try {
        const before = next === 1 ? [] : loaded.current
        const r = await searchAll({ ...query, q, page: next }, sources, ctrl.signal, (partial) =>
          setPhotos(mergeResults([before, partial])),
        )
        page.current = next
        loaded.current = mergeResults([before, r.photos])
        setPhotos(loaded.current)
        setFailed(r.failed)
        setHasMore(r.hasMore)
      } catch {
        // Aborted by a newer search.
      } finally {
        if (abort.current === ctrl) setLoading(false)
      }
    },
    // `key` stands for query and sources by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )

  useEffect(() => {
    // Next tick, so quick filter clicks collapse into one search.
    const t = setTimeout(() => void load(1), 0)
    return () => {
      clearTimeout(t)
      abort.current?.abort()
    }
  }, [load])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) void load(page.current + 1)
  }, [loading, hasMore, load])

  return { photos, failed, loading, hasMore, loadMore }
}
