<script setup lang="ts">
import { sectionThemes, type SectionThemeId } from '@/theme/sectionThemes'

defineProps<{
  titulo: string
  subtitulo?: string
  tema: SectionThemeId
}>()
</script>

<template>
  <header class="flex min-h-[4.25rem] items-center justify-between gap-3 px-2 pb-1 pt-5">
    <div class="min-w-0 flex-1">
      <h1 class="truncate text-2xl font-black leading-tight tracking-tight" :class="sectionThemes[tema].pageTitle">{{ titulo }}</h1>
      <p v-if="subtitulo" class="mt-1 text-sm font-medium leading-snug text-whitesmoke-500">{{ subtitulo }}</p>
    </div>
    <div v-if="$slots.acoes" class="flex shrink-0 items-center gap-2">
      <slot name="acoes" />
    </div>
  </header>
</template>
