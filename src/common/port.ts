export const DEFAULT_PORT = 3000

/**
 * Resolves the port to listen on from a raw environment value.
 *
 * `Number(process.env.PORT ?? 3000)` is a trap: `??` only falls back on
 * null/undefined, so a PORT that is set-but-empty survives and `Number('')`
 * is 0 — which tells the OS to pick any free ephemeral port. On a platform
 * that pins one primary port per service (Render, Fly, Heroku) the port then
 * moves on every boot and the platform restarts forever chasing it.
 *
 * So: missing or blank means "use the fallback", and anything that is not a
 * usable port number throws at boot instead of quietly binding somewhere
 * unpredictable.
 */
export function resolvePort(raw: string | undefined, fallback: number = DEFAULT_PORT): number {
  if (raw === undefined) return fallback

  const trimmed = raw.trim()
  if (trimmed === '') return fallback

  const parsed = Number(trimmed)

  if (parsed === 0) {
    throw new Error('PORT is 0, which binds a random port the platform cannot route to. Set a fixed port or leave PORT unset.')
  }

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535, got ${JSON.stringify(raw)}.`)
  }

  return parsed
}
