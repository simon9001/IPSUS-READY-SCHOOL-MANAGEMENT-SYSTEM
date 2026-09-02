import { EventEmitter } from 'node:events';
class AppEventEmitter extends EventEmitter {
    constructor() {
        super();
        // Support large numbers of concurrent SSE connections without Node memory leak warnings
        this.setMaxListeners(500);
    }
}
export const appEvents = new AppEventEmitter();
/**
 * Broadcasts a change signal to all active SSE listeners.
 * Note: Only lightweight metadata is broadcast — no sensitive data payload is sent,
 * ensuring 100% RBAC security on subsequent client fetches.
 */
export function broadcastChange(topic, action) {
    const event = {
        topic,
        action,
        timestamp: new Date().toISOString(),
    };
    appEvents.emit('change', event);
}
