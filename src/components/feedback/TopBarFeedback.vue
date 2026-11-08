<script setup lang="ts">
import { feedbackThemes } from '@/theme/feedbackThemes'
import { CheckCircle2, CircleX, AlertTriangle, Info, X } from 'lucide-vue-next'
import type { FeedbackMessage } from '@/utils/feedbackManager'
import { feedback } from '@/composables/useFeedback'
defineProps<{ notification: FeedbackMessage }>()
const icons = { success: CheckCircle2, error: CircleX, warning: AlertTriangle, info: Info }
</script>
<template>
  <div class="flex min-w-0 w-full items-center justify-center px-4 sm:px-6">
    <div :key="notification.id" class="relative flex w-full max-w-xl items-center gap-3 overflow-hidden rounded-full bg-white py-3 pl-4 pr-2 shadow-sm" :class="feedbackThemes[notification.kind].foreground">
      <component :is="icons[notification.kind]" :size="23" class="shrink-0" aria-hidden="true" />
      <p class="min-w-0 flex-1 break-words text-sm font-semibold leading-snug line-clamp-2" :title="notification.message" :role="notification.kind === 'error' ? 'alert' : 'status'" aria-atomic="true">{{ notification.message }}</p>
      <button type="button" aria-label="Fechar notificação" class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-whitesmoke-100 focus-visible:outline-2" @click="feedback.dismiss"><X :size="19" /></button>
      <div aria-hidden="true" class="absolute inset-x-5 bottom-0 h-0.5 origin-left bg-current opacity-30" :style="{ transform: `scaleX(${notification.remaining / notification.duration})` }" />
    </div>
  </div>
</template>
