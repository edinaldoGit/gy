<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTreinoStore } from '@/stores/treinoStore'

import TreinoPreview from '@/components/treino/TreinoPreview.vue'
import TreinoExecucao from '@/components/treino/TreinoExecucao.vue'
import TreinoConcluido from '@/components/treino/TreinoConcluido.vue'

const store = useTreinoStore()
const { estadoAtual } = storeToRefs(store)

onMounted(() => {
  store.carregarTreinoDoDia()
})
</script>

<template>
  <div class="flex flex-col gap-6 pb-8 h-full">
    <TreinoPreview v-if="estadoAtual === 'preview'" />
    <TreinoExecucao v-else-if="estadoAtual === 'execucao'" />
    <TreinoConcluido v-else-if="estadoAtual === 'concluido'" />
  </div>
</template>