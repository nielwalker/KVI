/* global process */
import { createClient } from '@supabase/supabase-js'

const parseEnv = (value) => String(value || '').trim()

export default async function handler(req, res) {
  const supabaseUrl = parseEnv(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)
  const serviceRoleKey = parseEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({
      message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.',
    })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  try {
    const [volunteers, committees, eventsDone, achievements] = await Promise.all([
      supabase.from('profiles').select('id', { head: true, count: 'exact' }).neq('name', ''),
      supabase.from('committees').select('id', { head: true, count: 'exact' }),
      supabase.from('events').select('id', { head: true, count: 'exact' }).eq('status', 'done'),
      supabase.from('achievements').select('id', { head: true, count: 'exact' }),
    ])

    const volunteerCount = Number(volunteers.count || 0)
    const committeeCount = Number(committees.count || 0)
    const activityCount = !eventsDone.error && typeof eventsDone.count === 'number'
      ? Number(eventsDone.count)
      : Number(achievements.count || 0)

    return res.status(200).json({
      volunteerCount,
      committeeCount,
      activityCount,
    })
  } catch (error) {
    console.error('Landing counts API error:', error)
    return res.status(500).json({
      message: 'Unable to load landing counts.',
    })
  }
}
