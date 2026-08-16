import { useState } from 'react'
import Brand from '../../components/ui/Brand'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { focusAspects as availableFocusAspects } from '../../lib/data/focusAspects'
import { saveProfile } from './profile.service'

export default function OnboardingPage({ email, onComplete }: { email?: string; onComplete: () => Promise<void> }) {
  const [name, setName] = useState(email?.split('@')[0] ?? '')
  const [protectTime, setProtectTime] = useState(true)
  const [focusAspects, setFocusAspects] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError('')
    try { await saveProfile({ displayName: name, protectPersonalTime: protectTime, focusAspects }); await onComplete() }
    catch (saveError) { console.error('Could not save onboarding', saveError); setError('We could not save your setup. Run the profile migration and try again.') }
    finally { setSaving(false) }
  }
  return (
    <main className="min-h-screen bg-[var(--color-background)] px-5 py-8"><div className="mx-auto max-w-2xl"><Brand /><Card className="mt-8 rounded-[var(--radius-large)] p-6 sm:p-9" aria-labelledby="onboarding-title"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-primary-dark)]">One-time setup</p><h1 id="onboarding-title" className="mt-2 text-3xl font-semibold">Make JoyFlow yours</h1><p className="mt-2 text-sm text-[var(--color-text-muted)]">These preferences stay connected to your account and guide future plans.</p>
      <form className="mt-7 grid gap-6" onSubmit={(event) => void submit(event)}>
        <label className="text-sm font-medium">What should we call you?<input className="mt-2 min-h-11 w-full rounded-[var(--radius-small)] border border-[var(--color-border)] px-3 focus-visible:outline-3 focus-visible:outline-[var(--color-focus)]" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} /></label>
        <label className="flex items-start gap-3 rounded-[var(--radius-small)] bg-[var(--color-primary-soft)] p-4 text-sm"><input className="mt-1 size-4" type="checkbox" checked={protectTime} onChange={(event) => setProtectTime(event.target.checked)} /><span><strong className="block">Protect personal time</strong><span className="text-[var(--color-text-muted)]">Leave room around fixed commitments instead of filling every open gap.</span></span></label>
        <fieldset><legend className="text-sm font-medium">What would you like more time for?</legend><p className="mt-1 text-xs text-[var(--color-text-muted)]">Choose any areas JoyFlow should protect during the week.</p><div className="mt-3 flex flex-wrap gap-2">{availableFocusAspects.map((aspect) => { const selected = focusAspects.includes(aspect); return <button key={aspect} type="button" aria-pressed={selected} onClick={() => setFocusAspects((current) => selected ? current.filter((item) => item !== aspect) : [...current, aspect])} className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${selected ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]' : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)]'}`}>{aspect}</button> })}</div></fieldset>
        {error && <p role="alert" className="text-sm text-[#8a4e3d]">{error}</p>}<Button type="submit" disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Continue to dashboard'}</Button>
      </form></Card></div></main>
  )
}
