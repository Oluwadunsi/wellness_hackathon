import { useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import Brand from './components/ui/Brand'
import AuthPage from './features/auth/AuthPage'
import useAuth from './features/auth/useAuth'
import CalendarConnect from './features/calendar/CalendarConnect'
import DashboardPage from './features/dashboard/DashboardPage'
import PlanGeneration from './features/planning/PlanGeneration'
import WeeklyPlanPage from './features/planning/WeeklyPlanPage'
import TaskCapture from './features/tasks/TaskCapture'
import { getPendingCalendarImport } from './features/calendar/calendar-import.service'
import OnboardingPage from './features/onboarding/OnboardingPage'
import useProfile from './features/onboarding/useProfile'

function ProtectedRoute({ session, children }: { session: Session | null; children: ReactNode }) {
  return session?.user ? children : <Navigate to="/login" replace />
}

function ConnectPage() {
  const navigate = useNavigate()
  const [generating, setGenerating] = useState(false)
  const firstImportedDate = getPendingCalendarImport().map((event) => event.startsAt.slice(0, 10)).sort()[0]

  if (generating) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] px-5 py-8 sm:px-6 sm:py-11">
        <Brand />
        <PlanGeneration planDate={firstImportedDate} onBack={() => setGenerating(false)} onComplete={() => navigate(firstImportedDate ? `/weekly-plan?date=${firstImportedDate}` : '/weekly-plan')} />
      </main>
    )
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] px-5 py-8 sm:px-6 sm:py-11">
      <Brand />
      <CalendarConnect onCustomize={() => navigate('/new-task')} onGenerate={() => setGenerating(true)} />
      <p className="mt-6 text-xs text-[var(--color-text-soft)]">
        <span className="mr-1.5" aria-hidden="true">♙</span>
        Connection is encrypted and secure.
      </p>
    </main>
  )
}

function NewTaskPage() {
  const [generating, setGenerating] = useState(false)
  const [planDate, setPlanDate] = useState<string | undefined>()
  const navigate = useNavigate()

  function beginGeneration(targetDate?: string) {
    setPlanDate(targetDate)
    setGenerating(true)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] px-5 py-8 sm:px-6 sm:py-11">
      <Brand />
      {generating ? (
        <PlanGeneration
          planDate={planDate}
          onBack={() => setGenerating(false)}
          onComplete={() => navigate(planDate ? `/weekly-plan?date=${planDate}` : '/weekly-plan')}
        />
      ) : (
        <TaskCapture
          onBack={() => navigate('/connect')}
          onIntegrated={beginGeneration}
        />
      )}
    </main>
  )
}

function App() {
  const { loading, session } = useAuth()
  const { loading: profileLoading, profile, reload: reloadProfile } = useProfile(session?.user.id)

  if (loading || (session && profileLoading)) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-background)]" aria-busy="true">
        <p className="text-sm text-[var(--color-text-muted)]" role="status">Loading JoyFlow…</p>
      </main>
    )
  }

  const protect = (page: ReactNode) => <ProtectedRoute session={session}>{page}</ProtectedRoute>

  return (
    <Routes>
      <Route path="/" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <AuthPage mode="sign-in" />} />
      <Route path="/signup" element={session ? <Navigate to={profile ? '/dashboard' : '/onboarding'} replace /> : <AuthPage mode="sign-up" />} />
      <Route path="/onboarding" element={session ? profile ? <Navigate to="/dashboard" replace /> : <OnboardingPage email={session.user.email} onComplete={reloadProfile} /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard" element={protect(<DashboardPage displayName={profile?.displayName} email={session?.user.email} />)} />
      <Route path="/connect" element={protect(<ConnectPage />)} />
      <Route path="/new-task" element={protect(<NewTaskPage />)} />
      <Route path="/weekly-plan" element={protect(<WeeklyPlanPage />)} />
      <Route path="*" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default App
