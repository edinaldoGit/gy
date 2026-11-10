<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { Trash2, AlertTriangle, Info, LoaderCircle } from 'lucide-vue-next'
import { confirmation } from '@/composables/useConfirm'
const { state } = confirmation
const panel = ref<HTMLElement | null>(null)
let previous: HTMLElement | null = null
const icons = { trash: Trash2, warning: AlertTriangle, info: Info }
const tones = { success: { icon: 'bg-teal-50 text-teal-700', button: 'bg-teal-600' }, error: { icon: 'bg-bubblegum-50 text-bubblegum-700', button: 'bg-bubblegum-700' }, warning: { icon: 'bg-amber-50 text-amber-800', button: 'bg-amber-600' }, info: { icon: 'bg-cerulean-50 text-cerulean-700', button: 'bg-cerulean-600' } }
watch(() => state.value.options, async (options, old) => {
  if (options && !old) {
    previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    await nextTick()
    panel.value?.querySelector<HTMLButtonElement>('button')?.focus()
  } else if (!options && old) {
    await nextTick()
    if (previous?.isConnected) previous.focus()
    else document.querySelector<HTMLElement>('main')?.focus()
    previous = null
  }
})
watch(() => state.value.busy, async busy => { if (busy) { await nextTick(); panel.value?.focus() } })
const keyboard = (event: KeyboardEvent) => {
  if (event.key === 'Escape') { event.preventDefault(); confirmation.cancel() }
  if (event.key !== 'Tab' || !panel.value) return
  const buttons = [...panel.value.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]')]
  const first = buttons[0], last = buttons.at(-1)
  if (!first) { event.preventDefault(); panel.value.focus(); return }
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
onBeforeUnmount(() => { confirmation.cancel() })
</script>
<template>
  <Transition name="confirm" :duration="{ enter: 400, leave: 280 }">
    <div v-if="state.options" class="absolute inset-0 z-[200] flex items-end justify-center overflow-y-auto bg-whitesmoke-950/25 backdrop-blur-sm sm:items-center sm:p-6" @keydown="keyboard">
      <section ref="panel" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" :aria-busy="state.busy" tabindex="-1" class="gy-modal-height w-full overflow-y-auto rounded-t-[2.5rem] bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-xl outline-none sm:max-w-md sm:rounded-[2rem]">
        <span class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" :class="tones[state.options.variant || 'info'].icon"><component :is="icons[state.options.icon || 'warning']" :size="27" /></span>
        <h2 id="confirm-title" class="text-center text-xl font-black text-whitesmoke-950">{{ state.options.title }}</h2>
        <p id="confirm-description" class="mt-3 text-center text-sm leading-relaxed text-whitesmoke-600">{{ state.options.message }}</p>
        <p v-if="state.options.details" class="whitespace-pre-line mt-3 rounded-xl bg-whitesmoke-50 p-3 text-xs leading-relaxed text-whitesmoke-600">{{ state.options.details }}</p>
        <p v-if="state.error" role="alert" class="mt-4 rounded-xl bg-bubblegum-50 p-3 text-sm text-bubblegum-700">{{ state.error }}</p>
        <div class="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" :disabled="state.busy" class="min-h-12 flex-1 rounded-full bg-whitesmoke-100 px-4 text-sm font-bold text-whitesmoke-700 disabled:opacity-50" @click="confirmation.cancel">{{ state.options.cancelText || 'Cancelar' }}</button>
          <button type="button" :disabled="state.busy" class="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold text-white disabled:opacity-50" :class="tones[state.options.variant || 'info'].button" @click="confirmation.accept"><LoaderCircle v-if="state.busy" :size="18" class="animate-spin" />{{ state.busy ? 'Processando…' : state.options.confirmText || 'Confirmar' }}</button>
        </div>
      </section>
    </div>
  </Transition>
</template>
<style scoped>
.confirm-enter-active,.confirm-leave-active { transition: opacity .2s ease; }
.confirm-enter-active section,.confirm-leave-active section { transition: transform .4s cubic-bezier(.22,1,.36,1); }
.confirm-leave-active section { transition-duration: .28s; }
.confirm-enter-from,.confirm-leave-to { opacity: 0; }
.confirm-enter-from section,.confirm-leave-to section { transform: translateY(100%); }
@media(prefers-reduced-motion:reduce) { *, section { transition: none !important; animation: none !important; } }
</style>
