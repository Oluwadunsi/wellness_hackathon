import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Brand from '../../components/ui/Brand'
import Button from '../../components/ui/Button'
import type { AuthMode } from '../../lib/types/auth'
import {
  sendPasswordReset,
  signInWithEmail,
  signUpWithEmail,
} from './auth.service'

function friendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('invalid login')) return 'The email or password is incorrect.'
  if (message.includes('already registered')) return 'An account already exists for this email.'
  if (message.includes('rate limit') || message.includes('too many')) return 'Too many attempts. Wait a moment, then try again.'
  if (message.includes('signup') && message.includes('disabled')) return 'Creating new accounts is currently unavailable.'
  if (message.includes('confirmation') || message.includes('send email')) return 'We could not send the confirmation email. Please try again shortly.'
  if (message.includes('invalid email') || message.includes('email address is invalid')) return 'Enter a valid email address.'
  if (message.includes('password')) return 'Use a password with at least six characters.'
  return 'We could not complete that request. Please try again.'
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'sign-in') {
        await signInWithEmail(email.trim(), password)
        navigate('/dashboard', { replace: true })
      } else {
        const result = await signUpWithEmail(email.trim(), password)
        if (result.session) {
          navigate('/onboarding', { replace: true })
        } else {
          setMessage('Check your email to confirm your account, then sign in.')
        }
      }
    } catch (authError) {
      console.error('Authentication request failed', authError)
      setError(friendlyAuthError(authError))
    } finally {
      setLoading(false)
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      setError('Enter your email address first.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await sendPasswordReset(email.trim())
      setMessage('Check your email for a password-reset link.')
    } catch (resetError) {
      setError(friendlyAuthError(resetError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-[var(--color-surface)] lg:grid-cols-2">
      <section className="hidden bg-[var(--color-primary-soft)] px-12 py-10 lg:flex lg:flex-col xl:px-20">
        <Brand />
        <div className="my-auto max-w-lg">
          <h1 className="mb-5 text-5xl font-semibold leading-[1.05] tracking-[-0.055em] text-[var(--color-text)]">
            A calmer plan for a <em className="font-medium text-[var(--color-primary-dark)]">full</em> life.
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-[var(--color-text-muted)]">
            Keep your commitments, make time for what matters, and leave room to breathe.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[430px]">
          <div className="mb-10 lg:hidden"><Brand /></div>
          <h2 className="mb-1 text-3xl font-semibold tracking-[-0.04em]">
            {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mb-8 text-sm text-[var(--color-text-muted)]">
            {mode === 'sign-in'
              ? "Let's shape a week with room to breathe."
              : 'Start planning around the life you actually have.'}
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="mb-2 block text-xs font-medium" htmlFor="auth-email">Email address</label>
            <input
              className="mb-5 min-h-12 w-full rounded-[var(--radius-small)] border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-primary)] focus:outline-3 focus:outline-[var(--color-focus)]"
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />

            <div className="mb-2 flex items-center justify-between gap-4">
              <label className="text-xs font-medium" htmlFor="auth-password">Password</label>
              {mode === 'sign-in' && (
                <button className="min-h-6 cursor-pointer border-0 bg-transparent px-1 text-xs text-[var(--color-primary-dark)] focus-visible:outline-3 focus-visible:outline-[var(--color-focus)]" type="button" onClick={handleReset}>
                  Forgot password?
                </button>
              )}
            </div>
            <input
              className="mb-5 min-h-12 w-full rounded-[var(--radius-small)] border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-primary)] focus:outline-3 focus:outline-[var(--color-focus)]"
              id="auth-password"
              type="password"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
            />

            {error && <p className="mb-4 rounded-[var(--radius-small)] bg-[#f8ece8] px-3 py-3 text-xs text-[#8a4e3d]" role="alert">{error}</p>}
            {message && <p className="mb-4 rounded-[var(--radius-small)] bg-[var(--color-primary-soft)] px-3 py-3 text-xs text-[var(--color-primary-dark)]" role="status">{message}</p>}

            <Button className="w-full" type="submit" disabled={loading || !email.trim() || password.length < 6}>
              {loading ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
            {mode === 'sign-in' ? 'New to JoyFlow?' : 'Already have an account?'}{' '}
            <Link className="font-semibold text-[var(--color-primary-dark)]" to={mode === 'sign-in' ? '/signup' : '/login'}>
              {mode === 'sign-in' ? 'Create an account' : 'Sign in'}
            </Link>
          </p>

          <aside className="mt-10 rounded-[var(--radius-small)] bg-[var(--color-background)] px-4 py-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
            <strong className="mb-1 block text-[var(--color-text)]">We value your privacy</strong>
            JoyFlow uses your information only to build your plan and enforce your account permissions.
          </aside>
        </div>
      </section>
    </main>
  )
}
