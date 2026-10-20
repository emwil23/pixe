import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Sign-in for the free AI server is set up on this deployment. */
export const supabaseConfigured = Boolean(url && anonKey)

let client: Promise<SupabaseClient | null> | null = null

/** Only used to sign in to the free AI server; tasks never leave the device. Loaded on first use. */
export function getSupabase(): Promise<SupabaseClient | null> {
  client ??=
    url && anonKey
      ? import('@supabase/supabase-js').then(({ createClient }) =>
          // The session is kept in this browser and refreshed automatically, so returning visitors stay
          // signed in. Passkeys are a Supabase beta that needs this opt-in.
          createClient(url, anonKey, { auth: { experimental: { passkey: true } } }),
        )
      : Promise.resolve(null)
  return client
}

export async function getAccessToken(): Promise<string | null> {
  const sb = await getSupabase()
  const { data } = (await sb?.auth.getSession()) ?? { data: { session: null } }
  return data.session?.access_token ?? null
}

const API_URL = import.meta.env.VITE_API_URL as string | undefined

/** Calls the shared EW account API as the signed-in user. */
async function me(method: 'GET' | 'POST' | 'DELETE', path = '') {
  const token = await getAccessToken()
  if (!token || !API_URL) throw new Error('Please sign in first.')
  const res = await fetch(`${API_URL}/api/me${path}`, {
    method,
    headers: { authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Account request failed (${res.status}).`)
  return res
}

/** Whether the user has confirmed they are 18+. Kept by the server, where users can't change it. */
export async function isAdult(): Promise<boolean> {
  if (!(await getAccessToken())) return false
  const body = (await (await me('GET')).json()) as { adult?: boolean }
  return body.adult === true
}

export async function sendMagicLink(email: string) {
  const sb = await getSupabase()
  if (!sb) throw new Error('Sign-in is not set up.')
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${location.origin}/settings` },
  })
  if (error) throw error
}

/** The code in the same email, for when the link opens in another browser or device. */
export async function verifyEmailCode(email: string, code: string) {
  const sb = await getSupabase()
  if (!sb) throw new Error('Sign-in is not set up.')
  const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' })
  if (error) throw error
}

export async function confirmAdult() {
  await me('POST', '/adult')
}

/** Deletes the account everywhere (all EW apps), then signs out. Tasks in this browser are untouched. */
export async function deleteAccount() {
  await me('DELETE')
  await signOut()
}

/** "Continue with Google" is shown once the Google provider is set up in Supabase. */
export const googleEnabled = import.meta.env.VITE_GOOGLE_SIGNIN === '1'

export async function signInWithGoogle() {
  const sb = await getSupabase()
  if (!sb) throw new Error('Sign-in is not set up.')
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${location.origin}/settings` },
  })
  if (error) throw error
}

export async function signOut() {
  await (await getSupabase())?.auth.signOut()
}

/** WebAuthn is available in this browser. */
export const passkeysSupported = () =>
  typeof window !== 'undefined' && 'PublicKeyCredential' in window

/** Signs in with a passkey saved on this device or in a password manager; no email needed. */
export async function signInWithPasskey() {
  const sb = await getSupabase()
  if (!sb) throw new Error('Sign-in is not set up.')
  const { error } = await sb.auth.signInWithPasskey()
  if (error) throw error
}

/** Saves a passkey for the signed-in user, for one-tap sign-in on any browser later. */
export async function addPasskey() {
  const sb = await getSupabase()
  if (!sb) throw new Error('Sign-in is not set up.')
  const { error } = await sb.auth.registerPasskey()
  if (error) throw error
}

/** How many passkeys the signed-in user has; 0 if that can't be read, so the app still offers to add one. */
export async function countPasskeys(): Promise<number> {
  try {
    const sb = await getSupabase()
    const { data } = (await sb?.auth.passkey.list()) ?? { data: null }
    return data?.length ?? 0
  } catch {
    return 0
  }
}
