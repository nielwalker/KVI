/* global process */
/* global Buffer */

import { createClient } from '@supabase/supabase-js'

const json = (res, status, body) => res.status(status).json(body)

const getBearerToken = (req) => {
  const raw = String(req.headers?.authorization || '').trim()
  const match = raw.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : ''
}

const getFallbackBearerToken = (req) => {
  // Some hosting layers may drop the Authorization header; allow explicit fallback headers.
  // Do NOT accept query-string tokens.
  const raw = String(req.headers?.['x-supabase-token'] || req.headers?.['x-access-token'] || '').trim()
  const match = raw.match(/^Bearer\s+(.+)$/i)
  if (match) return match[1].trim()
  return raw
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

const normalizePhilippinesMobile = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''

  // Keep leading +, strip spaces/dashes/parentheses.
  const cleaned = raw.replace(/[()\s-]+/g, '')

  if (cleaned.startsWith('+63')) return cleaned
  if (cleaned.startsWith('63')) return `+${cleaned}`
  if (cleaned.startsWith('0') && cleaned.length === 11) return `+63${cleaned.slice(1)}`
  if (cleaned.startsWith('9') && cleaned.length === 10) return `+63${cleaned}`

  // Unknown format; return as-is so provider can reject with a useful error.
  return cleaned
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' })

  const enabled = String(process.env.SMS_ENABLED || '').toLowerCase() === 'true'
  if (!enabled) return json(res, 200, { ok: true, skipped: true, reason: 'SMS disabled' })

  // Prefer VITE_SUPABASE_URL in case SUPABASE_URL is misconfigured in Vercel.
  // This keeps the serverless function aligned with the client-side Supabase project.
  const supabaseUrl = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim()
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!supabaseUrl || !serviceRoleKey) return json(res, 500, { ok: false, error: 'Supabase env not configured' })

  const supabaseAnonKey = String(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim()
  if (!supabaseAnonKey) {
    return json(res, 500, {
      ok: false,
      error: 'Supabase env not configured',
      details: 'Missing VITE_SUPABASE_ANON_KEY (public key).',
    })
  }

  const smsApiKey = String(process.env.SMS_API_KEY || '').trim()
  if (!smsApiKey) return json(res, 500, { ok: false, error: 'SMS provider env not configured' })

  const token = getBearerToken(req) || getFallbackBearerToken(req)
  if (!token) return json(res, 401, { ok: false, error: 'Missing auth token' })

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  // Verify JWT without relying on auth.sessions (avoids "Auth session missing!" issues).
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const verifyJwtClaims = async () => {
    const tokenParts = String(token || '').split('.')
    const isJwtLike = tokenParts.length === 3
    let decodedClaims = null
    try {
      if (isJwtLike) {
        const payload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')
        const jsonStr = Buffer.from(payload, 'base64').toString('utf8')
        const decoded = JSON.parse(jsonStr)
        decodedClaims = {
          aud: decoded?.aud,
          iss: decoded?.iss,
          exp: decoded?.exp,
          sub: decoded?.sub,
        }
      }
    } catch {
      // ignore
    }

    // Prefer getClaims() if available; falls back to getUser() otherwise.
    try {
      if (typeof supabaseAuth.auth.getClaims === 'function') {
        const { data, error } = await supabaseAuth.auth.getClaims(token)
        if (error) return { ok: false, error, decodedClaims }
        return { ok: true, claims: data?.claims || null, decodedClaims }
      }
    } catch (error) {
      // ignore and fall back
      return { ok: false, error, decodedClaims, mode: 'getClaims' }
    }

    const { data, error } = await supabaseAuth.auth.getUser(token)
    if (error || !data?.user?.id) return { ok: false, error, decodedClaims }
    return { ok: true, claims: { sub: data.user.id }, decodedClaims }
  }

  const verified = await verifyJwtClaims()
  const claims = verified?.claims || verified?.decodedClaims || null
  const requesterId = String(claims?.sub || '').trim()
  if (!requesterId) {
    return json(res, 401, {
      ok: false,
      error: 'Invalid auth token',
      details: verified?.error?.message || null,
      hint:
        'JWT verification failed. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY match the project that issued the token.',
      debug: {
        supabaseUrlHost: (() => {
          try {
            return new URL(supabaseUrl).host
          } catch {
            return null
          }
        })(),
        jwt: verified?.decodedClaims || null,
        verifyMode: typeof supabaseAuth.auth.getClaims === 'function' ? 'getClaims' : 'getUser',
      },
    })
  }
  const { data: requesterProfile, error: requesterProfileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', requesterId)
    .maybeSingle()

  if (requesterProfileError) return json(res, 500, { ok: false, error: 'Failed to validate requester' })
  const requesterRole = String(requesterProfile?.role || '').trim().toLowerCase()
  if (requesterRole !== 'admin') return json(res, 403, { ok: false, error: 'Forbidden' })

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const memberIds = Array.isArray(body.memberIds) ? body.memberIds.map(x => String(x)).filter(Boolean) : []
  if (memberIds.length === 0) return json(res, 200, { ok: true, sent: 0 })

  const message = formatAssignmentMessage({
    category: body?.category,
    dateTime: body?.dateTime,
    location: body?.location,
  })

  const { data: recipients, error: recipientError } = await supabaseAdmin
    .from('profiles')
    .select('id,contact_number')
    .in('id', memberIds)

  if (recipientError) return json(res, 500, { ok: false, error: 'Failed to load recipients' })

  const numbers = (Array.isArray(recipients) ? recipients : [])
    .map(row => String(row?.contact_number || '').trim())
    .filter(Boolean)

  if (numbers.length === 0) return json(res, 200, { ok: true, sent: 0, skipped: true, reason: 'No contact numbers' })

  // SMS API PH endpoint (x-api-key header).
  const smsApiUrl = 'https://smsapiph.onrender.com/api/v1/send/sms'

  const results = []
  for (const to of numbers) {
    try {
      const resp = await fetch(smsApiUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': smsApiKey,
        },
        body: JSON.stringify({
          recipient: normalizePhilippinesMobile(to),
          message,
        }),
      })
      const data = await resp.json().catch(async () => ({ raw: (await resp.text()).slice(0, 500) }))
      const providerOk = (() => {
        if (!resp.ok) return false
        if (data && typeof data === 'object') {
          // SMS API PH successful response commonly includes messageId / id fields.
          if (data.messageId || data.message_id || data.id) return true
          if (typeof data.success === 'boolean') return data.success
          if (typeof data.ok === 'boolean') return data.ok
          if (typeof data.status === 'string') return data.status.toLowerCase() === 'success'
          if (typeof data.error === 'string' && data.error.trim()) return false
          if (typeof data.message === 'string' && /fail|error|invalid/i.test(data.message)) return false
        }
        return true
      })()
      results.push({ to, ok: providerOk, status: resp.status, data })
    } catch (error) {
      results.push({ to, ok: false, status: 0, data: { error: String(error?.message || error) } })
    }
  }

  const sent = results.filter(r => r.ok).length
  return json(res, 200, { ok: true, sent, results })
}
