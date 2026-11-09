<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTreinoStore } from '@/stores/treinoStore'
import { onBeforeRouteLeave } from 'vue-router'

import TreinoPreview from '@/components/treino/TreinoPreview.vue'
import TreinoExecucao from '@/components/treino/TreinoExecucao.vue'
import TreinoConcluido from '@/components/treino/TreinoConcluido.vue'

const store = useTreinoStore()
const { estadoAtual } = storeToRefs(store)

onMounted(() => {
  store.carregarTreinoDoDia()
  window.addEventListener('pagehide', salvarSessaoAntesDeFechar)
  document.addEventListener('visibilitychange', salvarSessaoAoOcultar)
})

onUnmounted(() => {
  window.removeEventListener('pagehide', salvarSessaoAntesDeFechar)
  document.removeEventListener('visibilitychange', salvarSessaoAoOcultar)
})

const salvarSessaoAntesDeFechar = () => {
  store.preservarRascunho()
  void store.persistirSessaoAgora()
}

const salvarSessaoAoOcultar = () => {
  if (document.visibilityState === 'hidden') {
    store.preservarRascunho()
    void store.persistirSessaoAgora()
  }
}

onBeforeRouteLeave(async () => {
  if (store.sessaoEstado === 'em_andamento') {
    return await store.persistirSessaoAgora()
  }
  return true
})
</script>

<template>
  <div class="flex flex-col gap-6 pb-8 h-full">
    <TreinoPreview v-if="estadoAtual === 'preview'" />
    <TreinoExecucao v-else-if="estadoAtual === 'execucao'" />
    <TreinoConcluido v-else-if="estadoAtual === 'concluido'" />
  </div>
</template>
