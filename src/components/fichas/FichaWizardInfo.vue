<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Target } from 'lucide-vue-next'
import { useFichaStore } from '@/stores/fichaStore'
import FichaWizardHeader from './FichaWizardHeader.vue'

const store = useFichaStore()
const { fichaEditando, contextoWizard } = storeToRefs(store)
const temaAtual = computed(() => store.getCorObj(fichaEditando.value.corTema || 'cerulean'))
</script>

<template>
  <div class="flex flex-col gap-6 animate-in slide-in-from-right-4 pb-24">
    <FichaWizardHeader :titulo="contextoWizard === 'nova-ficha' ? 'Nova ficha' : 'Editar ficha'" subtitulo="Identidade do programa" :on-voltar="store.voltar" />
    <div class="mx-2 flex flex-col gap-6 rounded-[2rem] border border-whitesmoke-200 bg-white p-6 shadow-sm">
      <label class="block text-[11px] font-bold uppercase tracking-widest text-whitesmoke-400">
        <span class="mb-2 flex items-center gap-1.5"><Target :size="14" :class="temaAtual.text" /> Nome da ficha</span>
        <input v-model="fichaEditando.nome" type="text" placeholder="Ex.: ABCD Hipertrofia" class="w-full rounded-2xl border border-whitesmoke-200 bg-whitesmoke-50 px-4 py-4 text-lg font-medium normal-case tracking-normal text-whitesmoke-950 focus:outline-none focus:ring-2" />
      </label>
      <label class="block text-[11px] font-bold uppercase tracking-widest text-whitesmoke-400">
        <span class="mb-2 block">Objetivo ou descrição</span>
        <textarea v-model="fichaEditando.foco" rows="2" placeholder="Ex.: Hipertrofia com foco em membros superiores" class="w-full resize-y rounded-2xl border border-whitesmoke-200 bg-whitesmoke-50 px-4 py-3 text-sm font-medium normal-case tracking-normal text-whitesmoke-950 focus:outline-none focus:ring-2" />
      </label>

    </div>
    <div class="px-2">
      <button type="button" :disabled="store.salvando || !fichaEditando.nome?.trim()" class="w-full rounded-[1.25rem] bg-cerulean-600 py-4 text-sm font-black text-white shadow-md transition hover:bg-cerulean-700 disabled:opacity-50" @click="store.continuarParaTreinos">{{ store.salvando ? 'SALVANDO…' : contextoWizard === 'nova-ficha' ? 'ADICIONAR PRIMEIRO TREINO' : 'SALVAR DADOS DA FICHA' }}</button>
    </div>
  </div>
</template>
