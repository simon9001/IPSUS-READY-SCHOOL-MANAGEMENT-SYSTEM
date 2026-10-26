import { createRequire } from 'node:module'
import { config } from 'dotenv'
import { pino, type LoggerOptions } from 'pino'

// This module is imported (and so evaluated) before db/client.ts loads .env,
// so LOG_LEVEL/NODE_ENV from .env would otherwise be read too late. No
// override: a value already set in the shell or by vitest wins.
config({ quiet: true })

// pino-pretty is a devDependency, so a production install (pnpm install
// --prod) won't have it. Only use it when it's actually resolvable, and only
// for an interactive terminal — anything piped (a log shipper, `> file`,
// Render's log stream) gets one JSON object per line, which is what
// aggregators parse.
function prettyTransportAvailable(): boolean {
  if (process.env.NODE_ENV === 'production' || !process.stdout.isTTY) return false
  try {
    createRequire(import.meta.url).resolve('pino-pretty')
    return true
  } catch {
    return false
  }
}

const options: LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'school-api' },
  // A login body or an Authorization header must never end up in a log line,
  // even if someone later logs a whole request object by mistake.
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.newPassword', '*.passwordHash', '*.token'],
    censor: '[redacted]',
  },
}

if (prettyTransportAvailable()) {
  options.transport = { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname,service' } }
}

export const logger = pino(options)
