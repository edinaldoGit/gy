import { shallowRef } from 'vue'
import { ConfirmationManager, type ConfirmationOptions } from '@/utils/confirmationManager'
const state = shallowRef<{ options: ConfirmationOptions | null; busy: boolean; error: string }>({ options: null, busy: false, error: '' })
const manager = new ConfirmationManager(() => { state.value = { options: manager.options, busy: manager.busy, error: manager.error } })
export const confirmation = { state, ask: (options: ConfirmationOptions) => manager.ask(options), accept: () => manager.accept(), cancel: () => manager.cancel() }
