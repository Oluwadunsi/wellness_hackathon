import { supabase } from '../../lib/supabase'
import type { UserProfile } from '../../lib/types/profile'

type ProfileRow = { user_id: string; display_name: string; protect_personal_time: boolean; focus_aspects: string[]; timezone: string }
const fromRow = (row: ProfileRow): UserProfile => ({ userId: row.user_id, displayName: row.display_name, protectPersonalTime: row.protect_personal_time, focusAspects: row.focus_aspects ?? [], timezone: row.timezone })

export async function getProfile() {
  const { data, error } = await supabase.from('user_profiles').select('*').maybeSingle()
  if (error) throw error
  return data ? fromRow(data as ProfileRow) : null
}

export async function saveProfile(input: { displayName: string; protectPersonalTime: boolean; focusAspects: string[] }) {
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) throw new Error('Authentication required')
  const { data, error } = await supabase.from('user_profiles').upsert({
    user_id: authData.user.id,
    display_name: input.displayName.trim(),
    protect_personal_time: input.protectPersonalTime,
    focus_aspects: input.focusAspects,
    timezone: 'Europe/Stockholm',
  }).select().single()
  if (error) throw error
  return fromRow(data as ProfileRow)
}

export async function addProfileFocusAspects(aspects: string[]) {
  if (!aspects.length) return
  const { data, error } = await supabase.from('user_profiles').select('focus_aspects').single()
  if (error) throw error
  const combined = [...new Set([...((data.focus_aspects as string[] | null) ?? []), ...aspects])]
  const { error: updateError } = await supabase.from('user_profiles').update({ focus_aspects: combined }).eq('user_id', (await supabase.auth.getUser()).data.user?.id)
  if (updateError) throw updateError
}
