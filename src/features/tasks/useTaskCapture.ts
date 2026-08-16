import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { DesireInterpretation } from '../../lib/types/task'
import { createTask } from './task.service'
import { interpretTask } from './interpretation.service'
import { addProfileFocusAspects } from '../onboarding/profile.service'

const emptyInterpretation: DesireInterpretation = { items: [], explanation: '' }

function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export default function useTaskCapture() {
  const [intention, setIntention] = useState('')
  const [isInterpreting, setIsInterpreting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [date, setDate] = useState('')
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [integrated, setIntegrated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [interpretation, setInterpretation] = useState<DesireInterpretation>(emptyInterpretation)

  async function interpret() {
    if (!intention.trim()) return
    setIsInterpreting(true)
    setIntegrated(false)
    setError(null)
    try {
      const result = await interpretTask(intention)
      setInterpretation(result)
      setDate(result.items[0]?.plannedDate ?? '')
      setIsInterpreting(false)
      setShowPreview(true)
    } catch (interpretationError) {
      console.error('Could not interpret task', interpretationError)
      setError('JoyFlow could not map this desire. Please try again.')
      setIsInterpreting(false)
    }
  }

  function editInterpretation() {
    setShowPreview(false)
    setIntegrated(false)
    setError(null)
  }

  async function integrate() {
    setIsSaving(true)
    setError(null)

    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      setError('Sign in before adding this desire to your week.')
      setIsSaving(false)
      return false
    }

    try {
      await Promise.all(interpretation.items.map((item, index) => createTask(
        {
          rawInput: intention,
          title: item.title,
          durationMinutes: item.durationMinutes,
          deadline: item.deadlineDate ? new Date(`${item.deadlineDate}T23:59:59`).toISOString() : null,
          effort: item.effort,
          preferredPeriod: item.preferredPeriod,
          splittable: item.splittable,
          wellbeingPriority: item.wellbeingPriority,
          labels: selectedLabels,
          plannedDate: index === 0 && date ? date : item.plannedDate || today(),
        },
        data.user.id,
      )))
      await addProfileFocusAspects(selectedLabels)
      setIntegrated(true)
      return interpretation.items[0]?.plannedDate ?? date ?? today()
    } catch (saveError) {
      console.error('Could not save task', saveError)
      setError('We could not add this desire. Please try again.')
      return null
    } finally {
      setIsSaving(false)
    }
  }

  function toggleLabel(label: string) {
    setSelectedLabels((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    )
  }

  return {
    date,
    editInterpretation,
    error,
    integrated,
    integrate,
    interpretation,
    intention,
    interpret,
    isInterpreting,
    isSaving,
    labelsVisible,
    selectedLabels,
    setDate,
    setIntention,
    setLabelsVisible,
    showPreview,
    toggleLabel,
  }
}
