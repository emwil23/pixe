import { useSettings, type ProviderId } from '@/stores/settings'
import { buildPrompt, type ActionInputs, type ActionName } from './actions'
import { getAccessToken, isAdult, supabaseConfigured } from './supabase'

export interface Provider {
  id: ProviderId
  label: string
  blurb: string
  /** Can be picked at all here (config present, region allowed). */
  offered: () => boolean
  /** Ready to run without another sign-in step. */
  ready: () => boolean | Promise<boolean>
  run: <A extends ActionName>(
    action: A,
    input: ActionInputs[A],
    signal: AbortSignal,
  ) => AsyncIterable<string>
}

const API_URL = import.meta.env.VITE_API_URL as string | undefined

// The Gemini free tier behind our server can't serve the EEA, UK or Switzerland. The server enforces this by IP;
// the time zone check just avoids showing an option that would fail.
// shortcut: time zones are a rough proxy for location; the server's geo-IP check is the real gate.
const NON_EEA_EUROPE =
  /^Europe\/(Istanbul|Moscow|Kyiv|Kiev|Minsk|Belgrade|Sarajevo|Skopje|Tirane|Chisinau|Podgorica|Kaliningrad|Samara|Volgograd|Ulyanovsk|Saratov|Astrakhan|Kirov|Simferopol)$/
export function inBlockedRegion(tz = Intl.DateTimeFormat().resolvedOptions().timeZone): boolean {
  if (tz.startsWith('Europe/')) return !NON_EEA_EUROPE.test(tz)
  return /^Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)$/.test(tz)
}

async function* readText(res: Response): AsyncGenerator<string> {
  if (!res.ok || !res.body) throw new Error(await errorMessage(res))
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  for (;;) {
    const { value, done } = await reader.read()
    if (done) return
    yield value
  }
}

async function errorMessage(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
  const known: Record<string, string> = {
    quota_exceeded: "You've used today's free AI calls. They reset at midnight.",
    rate_limited: 'Too many requests. Wait a minute and try again.',
    region_unavailable:
      'The free AI server is not available in your region. Pick another provider in Settings.',
    adults_only: 'The free AI server is for people 18 and over.',
    unauthorized: 'Please sign in again in Settings.',
  }
  return (body.error && known[body.error]) ?? body.message ?? `AI request failed (${res.status}).`
}

/** Server-Sent Events from an OpenAI-compatible chat endpoint, reduced to the text deltas. */
async function* openAiStream(res: Response): AsyncGenerator<string> {
  let buffer = ''
  for await (const chunk of readText(res)) {
    buffer += chunk
    let nl: number
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim()
      buffer = buffer.slice(nl + 1)
      if (!line.startsWith('data:') || line === 'data: [DONE]') continue
      try {
        const json = JSON.parse(line.slice(5)) as { choices?: { delta?: { content?: string } }[] }
        const text = json.choices?.[0]?.delta?.content
        if (text) yield text
      } catch {
        // A keep-alive comment or partial line; skip it.
      }
    }
  }
}

function chat(
  url: string,
  key: string,
  model: string,
  action: ActionName,
  input: unknown,
  signal: AbortSignal,
) {
  const { system, prompt, image } = buildPrompt(action, input as never)
  return fetch(url, {
    method: 'POST',
    signal,
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      'X-Title': 'Pixe',
      'HTTP-Referer': location.origin,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: image
            ? [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: image } },
              ]
            : prompt,
        },
      ],
    }),
  })
}

/** A streamed part; only `type: 'text'` parts are the answer (others are reasoning, tool calls…). */
interface PuterChunk {
  type?: string
  text?: string
}
interface PuterUser {
  username: string
}
declare global {
  interface Window {
    puter?: {
      ai: {
        chat: {
          (
            messages: { role: 'system' | 'user'; content: string }[],
            opts: { stream: true; signal?: AbortSignal },
          ): Promise<AsyncIterable<PuterChunk>>
          /** A prompt about one image at a public URL. */
          (
            prompt: string,
            imageUrl: string,
            opts: { stream: true; signal?: AbortSignal },
          ): Promise<AsyncIterable<PuterChunk>>
        }
      }
      auth: {
        signIn: () => Promise<unknown>
        signOut: () => void
        isSignedIn: () => boolean
        getUser: () => Promise<PuterUser>
      }
    }
  }
}

let puterLoading: Promise<void> | null = null
/** Loads Puter.js once, on demand: it is a third-party script, so the app never loads it unless asked. */
export function loadPuter(): Promise<void> {
  puterLoading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://js.puter.com/v2/'
    s.onload = () => {
      resolve()
    }
    s.onerror = () => {
      puterLoading = null
      reject(new Error('Could not load Puter.'))
    }
    document.head.append(s)
  })
  return puterLoading
}

export const providers: Provider[] = [
  {
    id: 'ew',
    label: 'Pixe AI (free)',
    blurb:
      'Gemini through our server. Sign in by email; 30 calls a day. Not available in the EEA, UK or Switzerland, or under 18.',
    offered: () => Boolean(API_URL) && supabaseConfigured && !inBlockedRegion(),
    ready: async () => Boolean(await getAccessToken()) && (await isAdult()),
    async *run(action, input, signal) {
      const token = await getAccessToken()
      if (!token || !API_URL) throw new Error('Please sign in in Settings first.')
      const res = await fetch(`${API_URL}/api/ai/pixe/${action}`, {
        method: 'POST',
        signal,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(input),
      })
      yield* readText(res)
    },
  },
  {
    id: 'puter',
    label: 'Puter',
    blurb:
      'Free for you: Puter runs the model on your own free Puter account. Connect it once below.',
    offered: () => true,
    ready: () => window.puter?.auth.isSignedIn() ?? false,
    async *run(action, input, signal) {
      await loadPuter()
      if (!window.puter) throw new Error('Puter did not load.')
      const { system, prompt, image } = buildPrompt(action, input)
      const stream = image
        ? await window.puter.ai.chat(
            `${system}

${prompt}`,
            image,
            { stream: true, signal },
          )
        : await window.puter.ai.chat(
            [
              { role: 'system', content: system },
              { role: 'user', content: prompt },
            ],
            { stream: true, signal },
          )
      for await (const part of stream)
        if ((part.type ?? 'text') === 'text' && part.text) yield part.text
    },
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    blurb:
      'Connect your OpenRouter account. Free models by default; the key stays in this browser.',
    offered: () => true,
    ready: () => Boolean(useSettings.getState().openrouterKey),
    async *run(action, input, signal) {
      const { openrouterKey, openrouterModel } = useSettings.getState()
      if (!openrouterKey) throw new Error('Connect OpenRouter in Settings first.')
      const res = await chat(
        'https://openrouter.ai/api/v1/chat/completions',
        openrouterKey,
        openrouterModel,
        action,
        input,
        signal,
      )
      yield* openAiStream(res)
    },
  },
  {
    id: 'own',
    label: 'Your own key',
    blurb:
      'Any OpenAI-compatible API. The key is stored only in this browser and sent only to that API.',
    offered: () => true,
    ready: () => Boolean(useSettings.getState().ownKey),
    async *run(action, input, signal) {
      const { ownKey, ownBaseUrl, ownModel } = useSettings.getState()
      if (!ownKey) throw new Error('Add your API key in Settings first.')
      const res = await chat(
        `${ownBaseUrl.replace(/\/$/, '')}/chat/completions`,
        ownKey,
        ownModel,
        action,
        input,
        signal,
      )
      yield* openAiStream(res)
    },
  },
]

export const providerById = (id: ProviderId | null) =>
  providers.find((p) => p.id === id && p.offered())
