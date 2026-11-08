<script setup lang="ts">
import PagePillHeader from '@/components/layout/PagePillHeader.vue'

defineProps<{
  titulo: string
  subtitulo?: string
  onVoltar: () => void
}>()
</script>

<template>
  <PagePillHeader
    tema="fichas"
    :titulo="titulo"
    :subtitulo="subtitulo"
    mostrar-voltar
    @voltar="onVoltar"
  >
    <template #acoes><slot name="acoes" /></template>
  </PagePillHeader>
</template>
