import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { appEvents, type ChangeEvent } from '../../common/events.js'

export const realtimeRoutes = new Hono()

realtimeRoutes.get('/events', (c) => {
  return streamSSE(c, async (stream) => {
    // Initial connection handshake
    await stream.writeSSE({
      event: 'connected',
      data: JSON.stringify({ message: 'Connected to realtime stream' }),
    })

    const onDataChange = async (event: ChangeEvent) => {
      try {
        await stream.writeSSE({
          event: 'change',
          data: JSON.stringify(event),
        })
      } catch {
        // Stream might be closing
      }
    }

    appEvents.on('change', onDataChange)

    // Keepalive heartbeat ping every 25 seconds
    const pingInterval = setInterval(async () => {
      try {
        await stream.writeSSE({
          event: 'ping',
          data: 'keepalive',
        })
      } catch {
        clearInterval(pingInterval)
      }
    }, 25000)

    // Cleanup when client disconnects or aborts
    stream.onAbort(() => {
      clearInterval(pingInterval)
      appEvents.off('change', onDataChange)
    })

    // Block stream function to maintain connection
    await new Promise<void>((resolve) => {
      stream.onAbort(() => {
        resolve()
      })
    })
  })
})
