import type { FeedbackKind } from './feedbackManager.ts'
export interface ConfirmationOptions {
  title: string; message: string; details?: string
  variant?: FeedbackKind; icon?: 'trash' | 'warning' | 'info'
  confirmText?: string; cancelText?: string
  action?: () => Promise<unknown>
}
export class ConfirmationManager {
  options: ConfirmationOptions | null = null
  busy = false
  error = ''
  private resolve: ((value: boolean) => void) | null = null
  private changed: () => void
  constructor(changed: () => void = () => {}) { this.changed = changed }
  ask(options: ConfirmationOptions): Promise<boolean> {
    if (this.options) return Promise.resolve(false)
    this.options = options; this.error = ''
    const promise = new Promise<boolean>(resolve => { this.resolve = resolve })
    this.changed(); return promise
  }
  cancel() { if (!this.busy) this.finish(false) }
  private finish(result: boolean) {
    const resolve = this.resolve
    this.options = null; this.resolve = null; this.error = ''; this.busy = false
    this.changed(); resolve?.(result)
  }
  async accept() {
    if (!this.options || this.busy) return
    this.busy = true; this.error = ''; this.changed()
    try {
      const result = await this.options.action?.()
      if (result === false) throw new Error('Não foi possível concluir a operação. Tente novamente.')
      this.finish(true)
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Não foi possível concluir a operação.'
      this.busy = false; this.changed()
    }
  }
}
