<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { liveQuery } from 'dexie'
import { db } from '@/database/db'
import { diaLocal } from '@/utils/diasLocais'
import { storeToRefs } from 'pinia'
import { useTreinoStore } from '@/stores/treinoStore'
import { onBeforeRouteLeave } from 'vue-router'

import TreinoPreview from '@/components/treino/TreinoPreview.vue'
import TreinoExecucao from '@/components/treino/TreinoExecucao.vue'
import TreinoConcluido from '@/components/treino/TreinoConcluido.vue'

const store = useTreinoStore()
let timerDia: ReturnType<typeof setInterval> | undefined
let diaMostrado = diaLocal(new Date())
let pararObservacao: (() => void) | undefined
const atualizarDia = () => {
  const hoje = diaLocal(new Date())
  if (hoje !== diaMostrado && store.sessaoEstado !== 'em_andamento') { diaMostrado = hoje; void store.carregarTreinoDoDia() }
  else void store.atualizarLimiteDiario().catch(() => {})
}
const { estadoAtual } = storeToRefs(store)

onMounted(() => {
  store.carregarTreinoDoDia()
  const subscription = liveQuery(() => db.historico.where('estado').equals('finalizado').count()).subscribe({ next: atualizarDia, error: () => {} })
  pararObservacao = () => subscription.unsubscribe()
  timerDia = setInterval(atualizarDia, 30000)
  document.addEventListener('visibilitychange', atualizarDia)
  window.addEventListener('pagehide', salvarSessaoAntesDeFechar)
  document.addEventListener('visibilitychange', salvarSessaoAoOcultar)
})

onUnmounted(() => {
  pararObservacao?.()
  clearInterval(timerDia)
  document.removeEventListener('visibilitychange', atualizarDia)
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
