<script setup lang="ts">
import { feedback } from '@/composables/useFeedback'
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useFichaStore } from '@/stores/fichaStore'

import FichaList from '@/components/fichas/FichaList.vue'
import TreinoWizardInfo from '@/components/fichas/TreinoWizardInfo.vue'
import FichaWizardInfo from '@/components/fichas/FichaWizardInfo.vue'
import FichaWizardCatalogo from '@/components/fichas/FichaWizardCatalogo.vue'
import FichaWizardAjustes from '@/components/fichas/FichaWizardAjustes.vue'
import CriarExercicioModal from '@/components/fichas/CriarExercicioModal.vue'

const store = useFichaStore()
const route = useRoute()
watch(() => route.hash, hash => { if (hash.startsWith('#gy-ficha=')) store.modo = 'lista' }, { immediate: true })
const { modo, modalCriarExAberto } = storeToRefs(store)

onMounted(() => {
  store.carregarDados().catch(() => feedback.error('Não foi possível carregar as fichas.'))
})
</script>

<template>
  <div class="flex flex-col gap-6 pb-24 h-full">
    
    <p v-if="store.erroSalvamento" role="alert" class="rounded-2xl bg-bubblegum-50 p-4 text-sm text-bubblegum-700">{{ store.erroSalvamento }}</p>
    <FichaList v-if="modo === 'lista' || modo === 'detalhe'" />
    <FichaWizardInfo v-else-if="modo === 'step1'" />
    <TreinoWizardInfo v-else-if="modo === 'treino-info'" />
    <FichaWizardCatalogo v-else-if="modo === 'step2'" />
    <FichaWizardAjustes v-else-if="modo === 'step3'" />

    <Transition name="gy-modal" :duration="{ enter: 420, leave: 280 }" appear><CriarExercicioModal v-if="modalCriarExAberto" /></Transition>
  </div>
</template>
