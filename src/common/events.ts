import { EventEmitter } from 'node:events'

export type EventTopic =
  | 'journal'
  | 'fees'
  | 'budgets'
  | 'grants'
  | 'procurement'
  | 'payroll'
  | 'assets'
  | 'inventory'
  | 'banking'
  | 'students'
  | 'teachers'
  | 'subjects'
  | 'admissions'
  | 'attendance'
  | 'timetable'
  | 'leave'
  | 'discipline'
  | 'dashboard'
  | 'compliance'

export interface ChangeEvent {
  topic: EventTopic
  action: string
  timestamp: string
}

class AppEventEmitter extends EventEmitter {
  constructor() {
    super()
    // Support large numbers of concurrent SSE connections without Node memory leak warnings
    this.setMaxListeners(500)
  }
}

export const appEvents = new AppEventEmitter()

/**
 * Broadcasts a change signal to all active SSE listeners.
 * Note: Only lightweight metadata is broadcast — no sensitive data payload is sent,
 * ensuring 100% RBAC security on subsequent client fetches.
 */
export function broadcastChange(topic: EventTopic, action: string) {
  const event: ChangeEvent = {
    topic,
    action,
    timestamp: new Date().toISOString(),
  }
  appEvents.emit('change', event)
}
