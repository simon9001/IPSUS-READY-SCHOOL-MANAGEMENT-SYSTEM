// Every stored number today is in local 07…/01… form. Normalising to +254…
// lets two spellings of the same number match, and is the form SMS providers need.
export function normalisePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = raw.replace(/[\s-]/g, '')
  if (/^0[17]\d{8}$/.test(s)) return `+254${s.slice(1)}`
  if (/^254\d{9}$/.test(s)) return `+${s}`
  if (/^\+254\d{9}$/.test(s)) return s
  return null
}

/** Why a recipient cannot be texted: nothing stored, or something unusable stored. */
export function phoneProblem(raw: string | null | undefined): 'No phone number' | 'Invalid phone number' {
  return raw && raw.trim() ? 'Invalid phone number' : 'No phone number'
}
