import { Link } from '@tanstack/react-router'

/** Explains why an AI action can't run, with a way to fix it. */
export function AiNotice({ status, error }: { status: string; error: string | null }) {
  if (status === 'no-provider')
    return (
      <p
        role="status"
        className="border-accent-text/30 bg-accent/5 mt-2 rounded-xl border p-3 text-sm"
      >
        Pick an AI provider first.{' '}
        <Link
          to="/settings"
          hash="ai"
          className="text-accent-text font-medium underline underline-offset-4"
        >
          Open AI settings
        </Link>
      </p>
    )
  if (status === 'error' && error)
    return (
      <p
        role="alert"
        className="border-danger/30 bg-danger/10 text-danger mt-2 rounded-xl border p-3 text-sm"
      >
        {error}
      </p>
    )
  return null
}
