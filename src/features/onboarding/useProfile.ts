import { useCallback, useEffect, useState } from 'react'
import type { UserProfile } from '../../lib/types/profile'
import { getProfile } from './profile.service'

export default function useProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(Boolean(userId))
  const reload = useCallback(async () => {
    if (!userId) return
    try { setProfile(await getProfile()) }
    catch (error) { console.error('Could not load profile', error); setProfile(null) }
    finally { setLoading(false) }
  }, [userId])
  useEffect(() => {
    if (!userId) return
    let active = true
    void getProfile()
      .then((value) => { if (active) setProfile(value) })
      .catch((error) => { console.error('Could not load profile', error); if (active) setProfile(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [userId])
  return { loading, profile, reload }
}
