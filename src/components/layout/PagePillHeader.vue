<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { sectionThemes, type SectionThemeId } from '@/theme/sectionThemes'

withDefaults(defineProps<{
  titulo: string
  subtitulo?: string
  tema: SectionThemeId
  mostrarVoltar?: boolean
}>(), {
  subtitulo: '',
  mostrarVoltar: false
})

const emit = defineEmits<{ voltar: [] }>()
</script>

<template>
  <div class="sticky top-0 z-30 -mx-4 bg-whitesmoke-50 px-4 pb-3 pt-8 shadow-[0_8px_12px_-12px_rgba(0,0,0,0.45)]">
    <div class="flex min-h-[4.25rem] w-full items-center gap-3 rounded-[2rem] px-3 py-2.5 shadow-sm transition-colors duration-300" :class="sectionThemes[tema].header">
      <button
        v-if="mostrarVoltar"
        type="button"
        aria-label="Voltar"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
        @click="emit('voltar')"
      >
        <ArrowLeft :size="20" aria-hidden="true" />
      </button>

      <div class="min-w-0 flex-1">
        <h1 class="truncate text-xl font-black leading-tight text-white sm:text-2xl">{{ titulo }}</h1>
        <p v-if="subtitulo" class="truncate text-[10px] font-bold uppercase tracking-widest text-white/80">{{ subtitulo }}</p>
      </div>

      <div v-if="$slots.acoes" class="flex shrink-0 items-center gap-1.5">
        <slot name="acoes" />
      </div>
    </div>
  </div>
</template>
