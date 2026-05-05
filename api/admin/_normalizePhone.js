const normalizeDigits = (value) => String(value ?? '').trim().replace(/[^\d+]/g, '')

export const normalizePhMobileE164 = (value) => {
  const raw = normalizeDigits(value)
  if (!raw) return ''

  const strippedPlus = raw.startsWith('+') ? raw.slice(1) : raw
  let digits = strippedPlus.replace(/\D/g, '')

  if (digits.startsWith('63')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length > 10) digits = digits.slice(-10)

  if (digits.length !== 10 || !digits.startsWith('9')) return ''
  return `+63${digits}`
}

