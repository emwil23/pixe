import { finishOpenRouterAuth, openRouterPending, startOpenRouterAuth } from '@/ai/openrouter'
import { inBlockedRegion, loadPuter, providers } from '@/ai/providers'
import {
  addPasskey,
  confirmAdult,
  countPasskeys,
  deleteAccount,
  googleEnabled,
  getSupabase,
  isAdult,
  passkeysSupported,
  sendMagicLink,
  signInWithGoogle,
  signInWithPasskey,
  signOut,
  verifyEmailCode,
} from '@/ai/supabase'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { SOURCE_NAME, SOURCES } from '@/lib/photos'
import { useSettings, type ProviderId, type Theme } from '@/stores/settings'
import { Link } from '@tanstack/react-router'
import { KeyRound, Monitor, Moon, Sun, Trash2 } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className="border-line scroll-mt-24 border-b py-8 first:pt-0"
    >
      <h2 id={`${id}-h`} className="font-display mb-4 text-3xl">
        {title}
      </h2>
      {children}
    </section>
  )
}

const input =
  'h-10 w-full rounded-xl border border-line bg-bg px-3 text-sm outline-none focus:border-accent'

export function SettingsPage() {
  const s = useSettings()

  // Back from OpenRouter's consent screen with ?code=...
  useEffect(() => {
    const code = new URLSearchParams(location.search).get('code')
    // Supabase's email link also lands here with ?code=; leave that one for Supabase to exchange.
    if (!code || !openRouterPending()) return
    history.replaceState(null, '', location.pathname + location.hash)
    finishOpenRouterAuth(code)
      .then((ok) => ok && toast.success('OpenRouter connected'))
      .catch((e: unknown) =>
        toast.error(e instanceof Error ? e.message : 'OpenRouter sign-in failed'),
      )
  }, [])

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <PageHeader eyebrow="Preferences" title="Settings" />

      <Section id="theme" title="Theme">
        <div role="radiogroup" aria-label="Theme" className="flex gap-2">
          {(
            [
              ['system', 'System', Monitor],
              ['dark', 'Dark', Moon],
              ['light', 'Light', Sun],
            ] as [Theme, string, typeof Sun][]
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={s.theme === value}
              onClick={() => s.set({ theme: value })}
              className={cn(
                'flex items-center gap-2 rounded-full border px-4 py-2 text-sm',
                s.theme === value ? 'border-accent bg-accent/10' : 'border-line hover:bg-surface-2',
              )}
            >
              <Icon className="size-4" aria-hidden /> {label}
            </button>
          ))}
        </div>
      </Section>

      <Section id="ai" title="AI">
        <p className="text-muted mb-4 max-w-prose text-sm">
          AI is free in Pixe, never behind Pro. Pick where it runs. It sees your vibe, board text
          and public stock photos, never images you upload. See the{' '}
          <Link to="/privacy" className="text-accent-text underline underline-offset-4">
            privacy page
          </Link>
          .
        </p>
        <div role="radiogroup" aria-label="AI provider" className="grid gap-3 md:grid-cols-2">
          {providers.map((p) => {
            const offered = p.offered()
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={s.provider === p.id}
                disabled={!offered}
                onClick={() => s.set({ provider: p.id })}
                className={cn(
                  'rounded-2xl border p-4 text-left transition-colors disabled:opacity-50',
                  s.provider === p.id
                    ? 'border-accent-text bg-accent/5'
                    : 'border-line hover:bg-surface-2',
                )}
              >
                <span className="font-medium">{p.label}</span>
                <span className="text-muted mt-1 block text-sm">
                  {offered
                    ? p.blurb
                    : p.id === 'ew' && inBlockedRegion()
                      ? 'Not available in your region.'
                      : 'Not set up on this deployment.'}
                </span>
              </button>
            )
          })}
        </div>
        <ProviderSetup provider={s.provider} />
      </Section>

      <Section id="sources" title="Photo sources">
        <p className="text-muted mb-4 max-w-prose text-sm">
          Which libraries Pixe searches by default. Openverse photos carry Creative Commons
          licences; some forbid commercial use, so check each one.
        </p>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((src) => (
            <label
              key={src}
              className="border-line has-checked:border-accent-text flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={s.sources.includes(src)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...s.sources, src]
                    : s.sources.filter((x) => x !== src)
                  if (next.length) s.set({ sources: next })
                }}
                className="accent-[var(--accent-text)]"
              />
              {SOURCE_NAME[src]}
            </label>
          ))}
        </div>
      </Section>

      <p className="spec text-muted pt-8">Pixe build {__BUILD__}</p>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  type = 'number',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="spec text-muted">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={input}
      />
    </div>
  )
}

function ProviderSetup({ provider }: { provider: ProviderId | null }) {
  const s = useSettings()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [passkeys, setPasskeys] = useState<number | null>(null)
  const [code, setCode] = useState('')
  const [signedIn, setSignedIn] = useState(false)
  const [adult, setAdult] = useState(false)

  useEffect(() => {
    if (provider !== 'ew') return
    let unsubscribe = () => {}
    let live = true
    void getSupabase().then((sb) => {
      if (!sb || !live) return
      // Fires once straight away with the current session, then on every sign-in or sign-out.
      const { data } = sb.auth.onAuthStateChange((_event, session) => {
        setSignedIn(Boolean(session))
        void isAdult()
          .then(setAdult)
          .catch(() => setAdult(false))
        if (session) void countPasskeys().then(setPasskeys)
      })
      unsubscribe = () => data.subscription.unsubscribe()
    })
    return () => {
      live = false
      unsubscribe()
    }
  }, [provider])

  if (provider === 'ew')
    return (
      <div className="border-line mt-6 max-w-lg rounded-2xl border p-4">
        {!signedIn && passkeysSupported() && (
          <div className="border-line mb-4 flex flex-col gap-2 border-b pb-4">
            <Button
              variant="primary"
              className="self-start"
              onClick={() =>
                void signInWithPasskey()
                  .then(() => toast.success('Signed in'))
                  .catch(() =>
                    toast.error(
                      "No EWSTUDIOS passkey was found. Sign in by email once, then choose 'Add a passkey'.",
                    ),
                  )
              }
            >
              <KeyRound /> I have a passkey
            </Button>
            <p className="text-muted text-xs">
              Works with a passkey from any EWSTUDIOS app. New here? Sign in below first, then add a
              passkey (Face ID, fingerprint, Windows Hello or a password manager).
            </p>
          </div>
        )}
        {!signedIn && googleEnabled && (
          <Button
            className="mb-4"
            onClick={() =>
              void signInWithGoogle().catch(() => toast.error('Google sign-in did not start.'))
            }
          >
            Continue with Google
          </Button>
        )}
        {!signedIn && !sent ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              sendMagicLink(email)
                .then(() => setSent(true))
                .catch((err: unknown) =>
                  toast.error(err instanceof Error ? err.message : 'Could not send the email'),
                )
            }}
          >
            <label htmlFor="ew-email" className="text-sm">
              Sign in by email (used only to count your daily AI calls):
            </label>
            <div className="flex gap-2">
              <input
                id="ew-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input}
                autoComplete="email"
              />
              <Button type="submit" variant="primary">
                Email me
              </Button>
            </div>
          </form>
        ) : !signedIn ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              verifyEmailCode(email, code.trim())
                .then(() => toast.success('Signed in'))
                .catch(() => toast.error('That code is wrong or has expired. Request a new one.'))
            }}
          >
            <label htmlFor="ew-code" className="text-sm">
              We emailed {email}. Open the link on this device, or type the code from the email
              here:
            </label>
            <div className="flex gap-2">
              <input
                id="ew-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,10}"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className={`${input} font-mono tracking-[0.3em]`}
              />
              <Button type="submit" variant="primary">
                Verify
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => {
                setSent(false)
                setCode('')
              }}
            >
              Use a different email
            </Button>
          </form>
        ) : adult ? (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-accent-text">Signed in. 30 free AI calls a day.</span>
              <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                Sign out
              </Button>
            </div>
            {passkeysSupported() && !passkeys && (
              <div className="border-accent/30 bg-accent/10 flex flex-wrap items-center gap-3 rounded-xl border p-3">
                <p className="flex-1">Skip the email next time: add a passkey.</p>
                <Button
                  variant="ai"
                  size="sm"
                  onClick={() =>
                    void addPasskey()
                      .then(() => {
                        setPasskeys(1)
                        toast.success('Passkey added')
                      })
                      .catch(() => toast.error('The passkey was not saved.'))
                  }
                >
                  <KeyRound /> Add a passkey
                </Button>
              </div>
            )}
            {Boolean(passkeys) && (
              <p className="text-muted">
                {passkeys} passkey{passkeys === 1 ? '' : 's'} saved. It works in every EWSTUDIOS
                app.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 text-sm">
            <p>The free AI server is for people aged 18 or over.</p>
            <Button
              variant="primary"
              className="self-start"
              onClick={() =>
                void confirmAdult()
                  .then(() => setAdult(true))
                  .catch(() => toast.error('Could not save that. Please try again.'))
              }
            >
              I am 18 or older
            </Button>
          </div>
        )}
        {signedIn && (
          <Button
            variant="danger"
            size="sm"
            className="mt-4"
            onClick={() => {
              if (
                !confirm(
                  'Delete your EW account? Your sign-in, passkeys and AI usage are removed from our server for every EW app. Boards stay in this browser.',
                )
              )
                return
              deleteAccount()
                .then(() => toast.success('Account deleted'))
                .catch(() => toast.error('Could not delete the account. Please try again.'))
            }}
          >
            <Trash2 /> Delete my account
          </Button>
        )}
      </div>
    )

  if (provider === 'puter') return <PuterSetup />

  if (provider === 'openrouter')
    return (
      <div className="border-line mt-6 flex max-w-lg flex-col gap-3 rounded-2xl border p-4">
        {s.openrouterKey ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-accent-text">OpenRouter connected.</span>
            <Button variant="ghost" size="sm" onClick={() => s.set({ openrouterKey: null })}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            className="self-start"
            onClick={() => void startOpenRouterAuth()}
          >
            Connect OpenRouter
          </Button>
        )}
        <NumberField
          label="Model"
          type="text"
          value={s.openrouterModel}
          onChange={(v) => s.set({ openrouterModel: v })}
        />
      </div>
    )

  if (provider === 'own')
    return (
      <div className="border-line mt-6 grid max-w-lg gap-3 rounded-2xl border p-4">
        <NumberField
          label="API base URL"
          type="url"
          value={s.ownBaseUrl}
          onChange={(v) => s.set({ ownBaseUrl: v })}
        />
        <NumberField
          label="Model"
          type="text"
          value={s.ownModel}
          onChange={(v) => s.set({ ownModel: v })}
        />
        <NumberField
          label="API key (stored only in this browser)"
          type="password"
          value={s.ownKey ?? ''}
          onChange={(v) => s.set({ ownKey: v || null })}
        />
      </div>
    )

  return null
}

/** Puter runs the model on the user's own free Puter account; sign-in must start from a click (it's a popup). */
function PuterSetup() {
  const [state, setState] = useState<'loading' | 'out' | 'in' | 'error'>('loading')
  const [user, setUser] = useState('')

  useEffect(() => {
    let live = true
    loadPuter()
      .then(async () => {
        if (!live || !window.puter) return
        if (window.puter.auth.isSignedIn()) {
          setUser((await window.puter.auth.getUser()).username)
          setState('in')
        } else setState('out')
      })
      .catch(() => live && setState('error'))
    return () => {
      live = false
    }
  }, [])

  async function connect() {
    try {
      await window.puter?.auth.signIn()
      setUser((await window.puter?.auth.getUser())?.username ?? '')
      setState('in')
      toast.success('Puter connected')
    } catch {
      toast.error('Puter sign-in was closed or blocked. Allow pop-ups for this site and try again.')
    }
  }

  return (
    <div className="border-line mt-6 flex max-w-lg flex-col gap-3 rounded-2xl border p-4 text-sm">
      {state === 'loading' && <p className="text-muted">Loading Puter…</p>}
      {state === 'error' && (
        <p className="text-danger">Puter couldn't load. Check your connection or ad blocker.</p>
      )}
      {state === 'out' && (
        <>
          <p>Connect a free Puter account. It opens Puter's sign-in in a small window.</p>
          <Button variant="primary" className="self-start" onClick={() => void connect()}>
            Connect Puter
          </Button>
        </>
      )}
      {state === 'in' && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-accent-text">Connected to Puter{user && ` as ${user}`}.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.puter?.auth.signOut()
              setState('out')
            }}
          >
            Disconnect
          </Button>
        </div>
      )}
    </div>
  )
}
