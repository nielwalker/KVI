export const normalizePhMobileE164 = (value) => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  const digitsOnly = raw.replace(/[^\d+]/g, '')
  const strippedPlus = digitsOnly.startsWith('+') ? digitsOnly.slice(1) : digitsOnly
  let digits = strippedPlus.replace(/\D/g, '')

  if (digits.startsWith('63')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = digits.slice(1)

  if (digits.length > 10) digits = digits.slice(-10)

  // PH mobiles are typically 10 digits starting with 9 (e.g. 9XXXXXXXXX).
  if (digits.length !== 10 || !digits.startsWith('9')) return ''

  return `+63${digits}`
}

