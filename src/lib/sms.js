import { supabase } from './supabaseClient'

export const isSmsEnabledClient = () =>
  String(import.meta.env.VITE_SMS_ENABLED || '').toLowerCase() === 'true'

export const sendAssignmentSms = async ({ memberIds = [], category = '', dateTime = '', location = '' }) => {
  if (!isSmsEnabledClient()) return { ok: true, skipped: true }

  const ids = Array.isArray(memberIds) ? memberIds.map(x => String(x)).filter(Boolean) : []
  if (ids.length === 0) return { ok: true, sent: 0 }

  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token || ''
  if (!token) return { ok: false, error: 'Missing session token' }

  const resp = await fetch('/api/sms/assignment', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      'x-supabase-token': token,
    },
    body: JSON.stringify({ memberIds: ids, category, dateTime, location }),
  })

  const json = await resp.json().catch(() => null)
  if (resp.status === 404) {
    return {
      ok: false,
      error:
        'SMS endpoint not found. Start the app with `npm run dev:vercel` (or deploy to Vercel) so `/api/*` routes work.',
      details: json,
      status: resp.status,
    }
  }
  if (!resp.ok) {
    return {
      ok: false,
      error: json?.error || json?.message || 'Failed to send SMS',
      details: json,
      status: resp.status,
    }
  }
  return json
}
