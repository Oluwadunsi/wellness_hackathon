import { useEffect, useRef, useState } from 'react'
import type { GenerationStep } from '../../lib/types/planning'
import { generateAndSaveWeek } from './planning.service'

function weekStartFor(value?: string) {
  const base = value ? new Date(`${value}T12:00:00`) : new Date()
  const offset = base.getDay() === 0 ? -6 : 1 - base.getDay()
  base.setDate(base.getDate() + offset)
  const year = base.getFullYear()
  const month = String(base.getMonth() + 1).padStart(2, '0')
  const day = String(base.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const initialSteps: GenerationStep[] = [
  { id: 'calendar', label: 'Reading fixed calendar commitments', status: 'processing' },
  { id: 'tasks', label: 'Identifying focus requirements', status: 'queued' },
  { id: 'wellbeing', label: 'Protecting personal priority gaps', status: 'queued' },
  { id: 'schedule', label: 'Finalizing a sustainable daily flow', status: 'queued' },
]

export default function usePlanGeneration(planDate?: string) {
  const [steps, setSteps] = useState(initialSteps)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!started.current) {
      started.current = true
      void generateAndSaveWeek(weekStartFor(planDate))
        .then(() => setSaved(true))
        .catch((generationError) => {
          console.error('Could not generate plan', generationError)
          setError('JoyFlow could not save your generated plan. Please check that the planning migration has been run, then try again.')
        })
    }

    const timers = initialSteps.map((_, index) =>
      window.setTimeout(() => {
        setSteps((current) =>
          current.map((step, stepIndex) => ({
            ...step,
            status:
              stepIndex <= index
                ? 'complete'
                : stepIndex === index + 1
                  ? 'processing'
                  : 'queued',
          })),
        )
      }, 750 * (index + 1)),
    )

    return () => timers.forEach(window.clearTimeout)
  }, [planDate])

  return {
    complete: saved && steps.every((step) => step.status === 'complete'),
    error,
    steps,
  }
}
