/* global process */
import { createClient } from '@supabase/supabase-js'

const parseEnv = (value) => String(value || '').trim()

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,HEAD')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const supabaseUrl = parseEnv(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)
  const serviceRoleKey = parseEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const anonKey = parseEnv(process.env.VITE_SUPABASE_ANON_KEY)
  const key = serviceRoleKey || anonKey

  if (!supabaseUrl || !key) {
    return res.status(503).json({
      volunteerCount: 0,
      committeeCount: 0,
      activityCount: 0,
    })
  }

  try {
    const supabase = createClient(supabaseUrl, key, {
      auth: { persistSession: false },
    })

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
    // Graceful degradation - return defaults on error
    return res.status(200).json({
      volunteerCount: 0,
      committeeCount: 0,
      activityCount: 0,
    })
  }
}
