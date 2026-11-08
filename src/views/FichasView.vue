<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useFichaStore } from '@/stores/fichaStore'

import FichaList from '@/components/fichas/FichaList.vue'
import FichaWizardInfo from '@/components/fichas/FichaWizardInfo.vue'
import FichaWizardCatalogo from '@/components/fichas/FichaWizardCatalogo.vue'
import FichaWizardAjustes from '@/components/fichas/FichaWizardAjustes.vue'
import CriarExercicioModal from '@/components/fichas/CriarExercicioModal.vue'
import FichaDetalhesModal from '@/components/fichas/FichaDetalhesModal.vue' 

const store = useFichaStore()
const { modo, modalCriarExAberto, modalDetalhesAberto } = storeToRefs(store)

onMounted(() => {
  store.carregarDados()
})
</script>

<template>
  <div class="flex flex-col gap-6 pb-24 h-full">
    
    <FichaList v-if="modo === 'lista'" />
    <FichaWizardInfo v-else-if="modo === 'step1'" />
    <FichaWizardCatalogo v-else-if="modo === 'step2'" />
    <FichaWizardAjustes v-else-if="modo === 'step3'" />

    <CriarExercicioModal v-if="modalCriarExAberto" />
    <FichaDetalhesModal v-if="modalDetalhesAberto" /> 
    
  </div>
</template>