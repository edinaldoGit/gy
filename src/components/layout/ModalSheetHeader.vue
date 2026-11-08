<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  titulo: string
  subtitulo?: string
  etiqueta?: string
  corClasse: string
  tituloId?: string
  desabilitado?: boolean
}>()
defineEmits<{ fechar: [] }>()
</script>

<template>
  <header class="shrink-0 text-white" :class="corClasse">
    <div class="flex justify-center pb-2 pt-3" aria-hidden="true">
      <div class="h-1.5 w-12 rounded-full bg-white/30"></div>
    </div>
    <div class="flex items-start justify-between gap-4 border-b border-white/10 px-6 pb-5">
      <div class="min-w-0">
        <span v-if="etiqueta" class="mb-1 inline-block rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">{{ etiqueta }}</span>
        <h2 :id="tituloId" class="mt-1 break-words text-2xl font-black leading-tight">{{ titulo }}</h2>
        <p v-if="subtitulo" class="mt-1.5 text-sm font-medium text-white/80">{{ subtitulo }}</p>
      </div>
      <button type="button" aria-label="Fechar modal" :disabled="desabilitado" class="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50" @click="$emit('fechar')">
        <X :size="20" aria-hidden="true" />
      </button>
    </div>
  </header>
</template>
