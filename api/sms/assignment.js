/* global process */

import { createClient } from '@supabase/supabase-js'

const json = (res, status, body) => res.status(status).json(body)

const getBearerToken = (req) => {
  const raw = String(req.headers?.authorization || '').trim()
  const match = raw.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : ''
}

const formatAssignmentMessage = ({ category, dateTime, location }) => {
  const lines = [
    'KUSGAN: You have been assigned to an event.',
    `Category: ${String(category || 'N/A').trim() || 'N/A'}`,
    `Date & Time: ${String(dateTime || 'N/A').trim() || 'N/A'}`,
    `Location: ${String(location || 'N/A').trim() || 'N/A'}`,
  ]
  return lines.join('\n')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' })

  const enabled = String(process.env.SMS_ENABLED || '').toLowerCase() === 'true'
  if (!enabled) return json(res, 200, { ok: true, skipped: true, reason: 'SMS disabled' })

  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim()
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!supabaseUrl || !serviceRoleKey) return json(res, 500, { ok: false, error: 'Supabase env not configured' })

  const smsApiBaseUrl = String(process.env.SMS_API_BASE_URL || 'https://unismsapi.com/api').trim().replace(/\/+$/, '')
  const smsApiKey = String(process.env.SMS_API_KEY || '').trim()
  if (!smsApiKey) return json(res, 500, { ok: false, error: 'SMS provider env not configured' })

  const token = getBearerToken(req)
  if (!token) return json(res, 401, { ok: false, error: 'Missing auth token' })

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData?.user?.id) return json(res, 401, { ok: false, error: 'Invalid auth token' })

  const requesterId = authData.user.id
  const { data: requesterProfile, error: requesterProfileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', requesterId)
    .maybeSingle()

  if (requesterProfileError) return json(res, 500, { ok: false, error: 'Failed to validate requester' })
  if (String(requesterProfile?.role || '').trim() !== 'admin') return json(res, 403, { ok: false, error: 'Forbidden' })

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const memberIds = Array.isArray(body.memberIds) ? body.memberIds.map(x => String(x)).filter(Boolean) : []
  if (memberIds.length === 0) return json(res, 200, { ok: true, sent: 0 })

  const message = formatAssignmentMessage({
    category: body?.category,
    dateTime: body?.dateTime,
    location: body?.location,
  })

  const { data: recipients, error: recipientError } = await supabase
    .from('profiles')
    .select('id,contact_number')
    .in('id', memberIds)

  if (recipientError) return json(res, 500, { ok: false, error: 'Failed to load recipients' })

  const numbers = (Array.isArray(recipients) ? recipients : [])
    .map(row => String(row?.contact_number || '').trim())
    .filter(Boolean)

  if (numbers.length === 0) return json(res, 200, { ok: true, sent: 0, skipped: true, reason: 'No contact numbers' })

  // UniSMS API (SMS API PH) style: Basic auth with API key as username, empty password.
  const smsApiUrl = `${smsApiBaseUrl}/sms`
  const basicAuth = Buffer.from(`${smsApiKey}:`).toString('base64')

  const results = []
  for (const to of numbers) {
    try {
      const resp = await fetch(smsApiUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          recipient: to,
          content: message,
        }),
      })
      const text = await resp.text()
      results.push({ to, ok: resp.ok, status: resp.status, body: text.slice(0, 500) })
    } catch (error) {
      results.push({ to, ok: false, status: 0, body: String(error?.message || error) })
    }
  }

  const sent = results.filter(r => r.ok).length
  return json(res, 200, { ok: true, sent, results })
}
