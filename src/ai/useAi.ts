import { useSettings } from '@/stores/settings'
import { useCallback, useRef, useState } from 'react'
import { TEXT_ACTIONS, type ActionInputs, type ActionName, type ActionOutputs } from './actions'
import { jsonLines } from './lines'
import { providerById } from './providers'

type Status = 'idle' | 'running' | 'done' | 'error' | 'no-provider'

/**
 * Runs one AI action with the provider picked in Settings and streams the result:
 * items for JSON Lines actions, text for the Markdown ones (the brief).
 */
export function useAi<A extends ActionName>(action: A) {
  const providerId = useSettings((s) => s.provider)
  const [status, setStatus] = useState<Status>('idle')
  const [items, setItems] = useState<ActionOutputs[A][]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abort = useRef<AbortController | null>(null)

  const run = useCallback(
    async (input: ActionInputs[A]): Promise<ActionOutputs[A][]> => {
      const provider = providerById(providerId)
      if (!provider) {
        setStatus('no-provider')
        return []
      }
      abort.current?.abort()
      const controller = new AbortController()
      abort.current = controller
      setStatus('running')
      setItems([])
      setText('')
      setError(null)
      const out: ActionOutputs[A][] = []
      try {
        const stream = provider.run(action, input, controller.signal)
        if (TEXT_ACTIONS.includes(action)) {
          let all = ''
          for await (const chunk of stream) setText((all += chunk))
        } else {
          for await (const item of jsonLines<ActionOutputs[A]>(stream)) {
            out.push(item)
            setItems([...out])
          }
        }
        setStatus('done')
      } catch (e) {
        if (controller.signal.aborted) return out
        setError(e instanceof Error ? e.message : 'Something went wrong.')
        setStatus('error')
      }
      return out
    },
    [action, providerId],
  )

  const cancel = useCallback(() => {
    abort.current?.abort()
    setStatus('idle')
  }, [])

  return { run, cancel, status, items, text, error }
}
