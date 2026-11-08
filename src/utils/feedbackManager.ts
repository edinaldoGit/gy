export type FeedbackKind = 'success' | 'error' | 'warning' | 'info'
export interface FeedbackMessage { id: number; kind: FeedbackKind; message: string; duration: number; remaining: number }
const durations = { success: 3500, error: 8000, warning: 6000, info: 5000 }
const priority = { error: 3, warning: 2, info: 1, success: 0 }

/** Independente da UI e do banco; o relógio pode ser controlado nos testes. */
export class FeedbackManager {
  current: FeedbackMessage | null = null
  queue: FeedbackMessage[] = []
  private pauses = new Set<string>()
  private sequence = 0
  private lastTime: number
  private recent = new Map<string, number>()
  private changed: () => void
  private now: () => number
  constructor(changed: () => void = () => {}, now = () => Date.now()) { this.changed = changed; this.now = now; this.lastTime = now() }
  push(kind: FeedbackKind, message: string) {
    const text = message.trim()
    if (!text) return
    const key = `${kind}:${text}`, now = this.now()
    if (this.current && `${this.current.kind}:${this.current.message}` === key || this.queue.some(m => `${m.kind}:${m.message}` === key) || now - (this.recent.get(key) ?? -Infinity) < 2000) return
    this.recent.set(key, now)
    for (const [k, time] of this.recent) if (now - time > 10000) this.recent.delete(k)
    const item = { id: ++this.sequence, kind, message: text, duration: durations[kind], remaining: durations[kind] }
    if (kind === 'error' && this.current && this.current.kind !== 'error') {
      this.tick()
      if (this.current) this.queue.push(this.current)
      this.current = null
    }
    this.queue.push(item)
    this.queue.sort((a, b) => priority[b.kind] - priority[a.kind] || a.id - b.id)
    this.queue = this.queue.slice(0, 8)
    this.advance()
    this.changed()
  }
  private advance() {
    if (!this.current && !this.pauses.size) { this.current = this.queue.shift() ?? null; this.lastTime = this.now() }
  }
  dismiss() { this.current = null; this.advance(); this.changed() }
  pause(reason: string, paused: boolean) {
    this.tick()
    if (paused) this.pauses.add(reason); else this.pauses.delete(reason)
    this.lastTime = this.now(); this.advance(); this.changed()
  }
  tick() {
    const time = this.now(), delta = Math.max(0, time - this.lastTime)
    this.lastTime = time
    if (this.current && !this.pauses.size) {
      this.current.remaining = Math.max(0, this.current.remaining - delta)
      if (!this.current.remaining) { this.current = null; this.advance() }
      this.changed()
    }
  }
}
