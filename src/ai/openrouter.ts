import { useSettings } from '@/stores/settings'

const VERIFIER = 'pixe-or-verifier'

const base64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

/** OpenRouter OAuth with PKCE: the user approves on openrouter.ai and comes back with a one-time code. */
export async function startOpenRouterAuth() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)))
  sessionStorage.setItem(VERIFIER, verifier)
  const challenge = base64url(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)),
  )
  const params = new URLSearchParams({
    callback_url: `${location.origin}/settings`,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })
  location.assign(`https://openrouter.ai/auth?${params.toString()}`)
}

/** True while an OpenRouter sign-in started here is waiting for its callback. */
export const openRouterPending = () => sessionStorage.getItem(VERIFIER) !== null

/** Call on the callback page. Returns true if a key was saved. */
export async function finishOpenRouterAuth(code: string): Promise<boolean> {
  const verifier = sessionStorage.getItem(VERIFIER)
  if (!verifier) return false
  sessionStorage.removeItem(VERIFIER)
  const res = await fetch('https://openrouter.ai/api/v1/auth/keys', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: 'S256' }),
  })
  if (!res.ok) throw new Error('OpenRouter sign-in failed.')
  const { key } = (await res.json()) as { key: string }
  useSettings.getState().set({ openrouterKey: key, provider: 'openrouter' })
  return true
}
