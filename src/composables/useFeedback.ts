import { shallowRef } from 'vue'
import { FeedbackManager, type FeedbackKind, type FeedbackMessage } from '@/utils/feedbackManager'
const current = shallowRef<FeedbackMessage | null>(null)
const manager = new FeedbackManager(() => { current.value = manager.current ? { ...manager.current } : null })
export const feedback = {
  current,
  success: (message: string) => manager.push('success', message),
  error: (message: string) => manager.push('error', message),
  warning: (message: string) => manager.push('warning', message),
  info: (message: string) => manager.push('info', message),
  notify: (kind: FeedbackKind, message: string) => manager.push(kind, message),
  dismiss: () => manager.dismiss(),
  pause: (reason: string, paused: boolean) => manager.pause(reason, paused),
  tick: () => manager.tick()
}
