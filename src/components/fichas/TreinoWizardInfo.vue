<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Check, ChevronRight } from 'lucide-vue-next'
import { useFichaStore } from '@/stores/fichaStore'
import FichaWizardHeader from './FichaWizardHeader.vue'

const store = useFichaStore()
const { treinoEditando, fichaEditando, fichaSelecionada, contextoWizard, modo } = storeToRefs(store)
const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const ocupado = (dia: number) => fichaSelecionada.value?.treinos.some(t => t.id !== treinoEditando.value.id && t.diasDaSemana.includes(dia)) ?? false
const valido = computed(() => !!treinoEditando.value.nome.trim() && !!treinoEditando.value.foco.trim() && treinoEditando.value.diasDaSemana.length === 1 && !ocupado(treinoEditando.value.diasDaSemana[0]!))
</script>

<template>
  <div class="flex flex-col gap-5 pb-12">
    <FichaWizardHeader :titulo="contextoWizard === 'editar-treino' ? 'Editar treino' : 'Novo treino'" :subtitulo="fichaEditando.nome" :on-voltar="store.voltar" />
    <p class="px-3 text-xs font-semibold text-whitesmoke-500">Etapa 1 de 3 · Dados do treino</p>
    <div class="mx-2 flex flex-col gap-6 rounded-3xl border border-whitesmoke-200 bg-white p-5 shadow-sm">
      <label class="text-xs font-bold text-whitesmoke-600">Nome do treino
        <input v-model="treinoEditando.nome" placeholder="Ex.: Treino A" class="mt-2 w-full rounded-2xl border border-whitesmoke-200 bg-whitesmoke-50 px-4 py-3 text-sm text-whitesmoke-950 focus:outline-none focus:ring-2 focus:ring-cerulean-200" />
      </label>
      <label class="text-xs font-bold text-whitesmoke-600">Foco muscular
        <input v-model="treinoEditando.foco" placeholder="Ex.: Peito e tríceps" class="mt-2 w-full rounded-2xl border border-whitesmoke-200 bg-whitesmoke-50 px-4 py-3 text-sm text-whitesmoke-950 focus:outline-none focus:ring-2 focus:ring-cerulean-200" />
      </label>
      <fieldset>
        <legend class="mb-3 text-xs font-bold text-whitesmoke-600">Dia da semana · escolha um dia</legend>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button v-for="(dia, index) in dias" :key="dia" type="button" :disabled="ocupado(index)" :aria-pressed="treinoEditando.diasDaSemana.includes(index)" class="rounded-xl border px-3 py-3 text-xs font-semibold transition disabled:opacity-40" :class="treinoEditando.diasDaSemana.includes(index) ? 'border-cerulean-600 bg-cerulean-50 text-cerulean-700' : 'border-whitesmoke-200 text-whitesmoke-600'" @click="treinoEditando.diasDaSemana = [index]">{{ dia }}<span v-if="ocupado(index)" class="mt-1 block text-[10px]">Já programado</span></button>
        </div>
      </fieldset>
      <fieldset>
        <legend class="mb-3 text-xs font-bold text-whitesmoke-600">Cor do treino</legend>
        <div class="flex flex-wrap gap-3">
          <button v-for="cor in store.paletaCores" :key="cor.id" type="button" :disabled="store.corEstaEmUso(cor.id)" :title="store.corEstaEmUso(cor.id) ? 'Cor ocupada por outro treino' : cor.id" :aria-label="`${cor.id}${store.corEstaEmUso(cor.id) ? ': ocupada' : ''}`" :aria-pressed="treinoEditando.corTema === cor.id" class="flex h-10 w-10 items-center justify-center rounded-full transition disabled:opacity-20 disabled:cursor-not-allowed disabled:ring-2 disabled:ring-whitesmoke-400" :class="[cor.bg, treinoEditando.corTema === cor.id ? 'ring-4 ring-whitesmoke-200 ring-offset-2' : 'opacity-60']" @click="treinoEditando.corTema = cor.id"><Check v-if="treinoEditando.corTema === cor.id" :size="18" class="text-white" /></button>
        </div>
      </fieldset>
    </div>
    <button type="button" :disabled="!valido" class="mx-2 flex items-center justify-center gap-2 rounded-2xl bg-cerulean-600 p-4 text-sm font-bold text-white disabled:opacity-40" @click="modo = 'step2'">Selecionar exercícios <ChevronRight :size="18" /></button>
  </div>
</template>
