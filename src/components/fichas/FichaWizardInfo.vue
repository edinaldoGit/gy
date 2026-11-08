<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useFichaStore } from '@/stores/fichaStore'
import { Target, Palette, Calendar, Check } from 'lucide-vue-next'
import { computed } from 'vue'
import FichaWizardHeader from './FichaWizardHeader.vue' // Ajuste o caminho caso sua pasta seja diferente

const store = useFichaStore()
const { modo, fichaEditando, diasOcupados } = storeToRefs(store) 
const { voltar, paletaCores, corEstaEmUso, getCorObj } = store

const diasSemanas = [
  { id: 0, label: 'D' }, { id: 1, label: 'S' }, { id: 2, label: 'T' }, 
  { id: 3, label: 'Q' }, { id: 4, label: 'Q' }, { id: 5, label: 'S' }, { id: 6, label: 'S' }
]

const toggleDia = (id: number) => {
  if (!fichaEditando.value.diasDaSemana) fichaEditando.value.diasDaSemana = []
  const idx = fichaEditando.value.diasDaSemana.indexOf(id)
  if (idx > -1) fichaEditando.value.diasDaSemana.splice(idx, 1)
  else fichaEditando.value.diasDaSemana.push(id)
}

// Computa a cor atual selecionada, ou o padrão (cerulean) se nenhuma estiver definida.
const temaAtual = computed(() => getCorObj(fichaEditando.value.corTema || 'cerulean'))
</script>

<template>
  <div class="flex flex-col gap-6 animate-in slide-in-from-right-4 h-full pb-24">
    
    <!-- HEADER REUTILIZÁVEL -->
    <FichaWizardHeader 
      :titulo="fichaEditando.id ? 'Editar Treino' : 'Identidade do Treino'"
      subtitulo="Etapa 1 de 3"
      :corTemaBg="temaAtual.bg"
      :onVoltar="voltar"
    />

    <!-- CORPO DO FORMULÁRIO -->
    <div class="bg-white rounded-[2rem] p-6 shadow-sm border border-whitesmoke-200 flex flex-col gap-6 mx-2">
      <div>
        <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Target :size="14" :class="temaAtual.text"/> Nome da Ficha
        </label>
        <input 
          v-model="fichaEditando.nome" 
          type="text" 
          placeholder="Ex: Treino A - Superior" 
          class="w-full bg-whitesmoke-50 border border-whitesmoke-200 rounded-2xl px-4 py-4 text-whitesmoke-950 font-medium focus:outline-none focus:ring-2 transition-all text-lg"
          :class="`focus:border-${temaAtual.id}-500 focus:ring-${temaAtual.id}-500/20`" 
        />
      </div>

      <div>
        <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-2">Foco Muscular</label>
        <input 
          v-model="fichaEditando.foco" 
          type="text" 
          placeholder="Ex: Força e Hipertrofia" 
          class="w-full bg-whitesmoke-50 border border-whitesmoke-200 rounded-2xl px-4 py-3 text-whitesmoke-950 font-medium focus:outline-none focus:ring-2 transition-all"
          :class="`focus:border-${temaAtual.id}-500 focus:ring-${temaAtual.id}-500/20`" 
        />
      </div>
      
      <!-- SELETOR DOS DIAS DA SEMANA COM TRAVA VISUAL -->
      <div>
        <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Calendar :size="14" :class="temaAtual.text"/> Dias da Semana
        </label>
        <div class="flex items-center justify-between px-1">
          <button 
            v-for="dia in diasSemanas" :key="dia.id"
            @click="!diasOcupados.includes(dia.id) && toggleDia(dia.id)"
            :disabled="diasOcupados.includes(dia.id)"
            class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all"
            :class="[
              fichaEditando.diasDaSemana?.includes(dia.id) ? `text-white shadow-md scale-110 ${temaAtual.bg}` : 'bg-whitesmoke-100 text-whitesmoke-400',
              diasOcupados.includes(dia.id) ? 'opacity-30 grayscale cursor-not-allowed border-transparent' : 'hover:bg-whitesmoke-200'
            ]"
          >
            {{ dia.label }}
          </button>
        </div>
        <p class="text-[9px] text-whitesmoke-400 mt-3 text-center">Dias opacos já possuem um treino alocado.</p>
      </div>

      <!-- SELETOR DE CORES -->
      <div>
        <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Palette :size="14" :class="temaAtual.text"/> Cor de Destaque
        </label>
        <div class="flex items-center justify-between gap-2 px-1">
          <button 
            v-for="cor in paletaCores" :key="cor.id"
            @click="!corEstaEmUso(cor.id) && (fichaEditando.corTema = cor.id)"
            :disabled="corEstaEmUso(cor.id)"
            class="w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 border-2"
            :class="[
              cor.bg, 
              fichaEditando.corTema === cor.id ? 'ring-4 ring-offset-2 ring-whitesmoke-50 border-white scale-110 shadow-md' : '', 
              corEstaEmUso(cor.id) ? 'opacity-20 grayscale cursor-not-allowed border-transparent' : 'hover:opacity-100 border-transparent', 
              !corEstaEmUso(cor.id) && fichaEditando.corTema !== cor.id ? 'opacity-50' : ''
            ]"
          >
            <Check v-if="fichaEditando.corTema === cor.id" :size="16" class="text-white" stroke-width="3" />
          </button>
        </div>
      </div>
    </div>

    <!-- BOTÃO INFERIOR DINÂMICO -->
    <div class="flex-1 flex items-end px-2">
      <button 
        @click="modo = 'step2'" :disabled="!fichaEditando.nome"
        class="w-full text-white disabled:opacity-50 disabled:active:scale-100 font-black text-sm py-4 rounded-[1.25rem] flex items-center justify-center transition-all shadow-md active:scale-[0.98]"
        :class="[temaAtual.bg, `hover:bg-${temaAtual.id}-600`]"
      >
        AVANÇAR PARA EXERCÍCIOS
      </button>
    </div>
  </div>
</template>