<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import { confirmation } from '@/composables/useConfirm'
import { feedback } from '@/composables/useFeedback'
import { useRoute } from 'vue-router'
import TopBar from '@/components/layout/TopBar.vue'
import { sequencia } from '@/services/sequencia'

const route = useRoute()
const { state } = confirmation
let interval: ReturnType<typeof setInterval> | undefined
let pararSequencia: (() => void) | undefined
const visibility = () => feedback.pause('hidden', document.hidden)
watch(() => route.path === '/onboarding', hidden => feedback.pause('no-surface', hidden), { immediate: true })
watch(() => !!state.value.options, open => feedback.pause('confirmation', open), { flush: 'sync' })
onMounted(() => {
  pararSequencia = sequencia.iniciar()
  visibility()
  document.addEventListener('visibilitychange', visibility)
  interval = setInterval(feedback.tick, 50)
})
onBeforeUnmount(() => { pararSequencia?.(); clearInterval(interval); document.removeEventListener('visibilitychange', visibility) })
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-whitesmoke-50">
    
    <div v-if="route.path !== '/onboarding'" class="relative z-[100] shrink-0" :inert="!!state.options"><TopBar /></div>

    <div class="relative isolate z-0 min-h-0 flex-1">

    <main tabindex="-1" :inert="!!state.options" class="h-full min-h-0 overflow-y-auto px-4 pb-4" :class="{ '!overflow-hidden': !!state.options }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <ConfirmDialog />
    </div>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
