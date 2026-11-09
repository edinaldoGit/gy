<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFichaStore } from '@/stores/fichaStore'
import { Clock, Check, Trash2, Save, Timer } from 'lucide-vue-next'
import FichaWizardHeader from './FichaWizardHeader.vue'

const store = useFichaStore()
const { treinoEditando, descansoGlobal, catalogo, contextoWizard } = storeToRefs(store)
const { voltar, removerExercicioDaFicha, salvarFicha, getCorObj } = store

const aplicarDescansoLocal = () => {
  if (!treinoEditando.value.exercicios) return
  treinoEditando.value.exercicios.forEach((ex: any) => {
    if (ex.temDescanso !== false) {
      ex.descansoSegundos = descansoGlobal.value
    }
  })
}

const toggleDescansoExercicio = (ex: any) => {
  ex.temDescanso = ex.temDescanso === false ? true : false
}

const temaAtual = computed(() => getCorObj(treinoEditando.value.corTema || 'cerulean'))
const nomeExercicio = (id: number) => catalogo.value.find(ex => ex.id === id)
</script>

<template>
  <div class="flex flex-col relative">
    
    <FichaWizardHeader
      titulo="Séries e repetições"
      :subtitulo="treinoEditando.nome"
      :onVoltar="voltar"
    />

    <p class="px-4 py-3 text-xs font-semibold text-whitesmoke-500">Etapa 3 de 3 · Ajuste as séries e repetições antes de salvar</p>

    <div class="px-4 pt-1 pb-6 flex flex-col gap-4">
      
      <div class="bg-white rounded-[1.5rem] p-4 shadow-sm border border-whitesmoke-200 flex items-center justify-between">
        <div>
          <h4 class="text-sm font-bold text-whitesmoke-950 flex items-center gap-1.5">
            <Clock :size="16" class="text-whitesmoke-500"/> Descanso Global
          </h4>
          <p class="text-[10px] text-whitesmoke-500 mt-0.5 max-w-[130px] leading-tight">Aplicar em todos os ativados</p>
        </div>
        <div class="flex items-center gap-2">
          <input 
            type="number" 
            v-model.number="descansoGlobal" aria-label="Descanso global em segundos" min="0" max="86400"
            class="w-14 bg-whitesmoke-50 rounded-xl px-2 py-2 text-center font-bold text-sm border border-whitesmoke-200 outline-none focus:ring-2 focus:border-whitesmoke-300 focus:ring-whitesmoke-200 transition-all" 
          />
          <span class="text-xs font-bold text-whitesmoke-400">s</span>
          <button 
            @click="aplicarDescansoLocal" aria-label="Aplicar descanso global"
            class="p-2 rounded-xl text-white transition-colors active:scale-95 shadow-sm"
            :class="[temaAtual.bg]"
          >
            <Check :size="16" stroke-width="3" />
          </button>
        </div>
      </div>

      <div 
        v-for="(ex, index) in treinoEditando.exercicios"
        :key="index"
        class="bg-white rounded-[1.5rem] p-4 shadow-sm border transition-colors"
        :class="(ex as any).temDescanso !== false ? 'border-whitesmoke-200' : 'border-whitesmoke-200 opacity-80'"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm bg-whitesmoke-100 text-whitesmoke-500 border border-whitesmoke-200">
              {{ index + 1 }}
            </div>
            <div>
              <h4 class="text-sm font-bold text-whitesmoke-950 pr-4 truncate max-w-[180px]">{{ nomeExercicio(ex.exercicioId)?.nome || 'Exercício indisponível' }}</h4>
              <p class="text-[10px] font-bold text-whitesmoke-400 uppercase tracking-widest mt-0.5">{{ nomeExercicio(ex.exercicioId)?.grupoMuscular || 'Exercício personalizado' }}</p>
            </div>
          </div>
          <button @click="removerExercicioDaFicha(index)" :aria-label="`Remover ${nomeExercicio(ex.exercicioId)?.nome || 'exercício'}`" class="text-red-400 p-2 hover:bg-red-50 rounded-xl transition-colors shrink-0">
            <Trash2 :size="16" />
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="bg-whitesmoke-50 rounded-xl p-2 border border-whitesmoke-100 flex flex-col items-center">
            <span class="block text-[9px] font-bold text-whitesmoke-400 uppercase tracking-wider mb-1">Séries</span>
            <input type="number" v-model.number="ex.series" :aria-label="`Séries de ${nomeExercicio(ex.exercicioId)?.nome}`" min="1" max="100" class="w-full bg-transparent text-center font-semibold text-whitesmoke-950 text-sm outline-none" />
          </div>
          <div class="bg-whitesmoke-50 rounded-xl p-2 border border-whitesmoke-100 flex flex-col items-center">
            <span class="block text-[9px] font-bold text-whitesmoke-400 uppercase tracking-wider mb-1">Reps Alvo</span>
            <input type="text" v-model="ex.repsAlvo" :aria-label="`Repetições alvo de ${nomeExercicio(ex.exercicioId)?.nome}`" class="w-full bg-transparent text-center font-semibold text-whitesmoke-950 text-sm outline-none" />
          </div>
          
          <div class="bg-whitesmoke-50 rounded-xl p-2 border border-whitesmoke-100 flex flex-col items-center">
            <span class="block text-[9px] font-bold text-whitesmoke-400 uppercase tracking-wider mb-1">Taxa (+kg)</span>
            <input type="number" v-model.number="ex.taxaAumentoKg" :aria-label="`Aumento de carga de ${nomeExercicio(ex.exercicioId)?.nome} em kg`" min="0" max="1000" class="w-full bg-transparent text-center font-semibold text-whitesmoke-950 text-sm outline-none" />
          </div>
          
          <div class="bg-teal-50/50 rounded-xl p-2 border flex flex-col items-center justify-between" :class="(ex as any).temDescanso !== false ? 'border-teal-100' : 'border-whitesmoke-200 grayscale opacity-50'">
            <div class="w-full flex items-center justify-between px-1">
              <Timer :size="12" class="text-teal-600" />
              <button @click="toggleDescansoExercicio(ex)" :aria-label="`Descanso de ${nomeExercicio(ex.exercicioId)?.nome}`" :aria-pressed="ex.temDescanso !== false" class="w-8 h-4 rounded-full p-0.5 transition-colors" :class="(ex as any).temDescanso !== false ? 'bg-teal-500' : 'bg-whitesmoke-300'">
                <div class="w-3 h-3 bg-white rounded-full transition-transform" :class="(ex as any).temDescanso !== false ? 'translate-x-4' : 'translate-x-0'"></div>
              </button>
            </div>
            <div class="flex items-end gap-1 mt-1">
              <input type="number" v-model.number="ex.descansoSegundos" :aria-label="`Descanso de ${nomeExercicio(ex.exercicioId)?.nome} em segundos`" min="0" max="86400" :disabled="(ex as any).temDescanso === false" class="w-10 bg-transparent text-center font-semibold text-teal-700 text-sm outline-none disabled:bg-transparent" />
              <span class="text-[9px] font-bold text-teal-600 uppercase tracking-wider pb-1">seg</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-2 mb-4">
        <button 
          @click="salvarFicha"
          :disabled="store.salvando"
          :aria-busy="store.salvando"
          class="flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-cerulean-500 py-4 text-sm font-black text-white shadow-md transition-all hover:bg-cerulean-600 active:scale-[0.98]"
        >
          <Save :size="20" />
          {{ store.salvando ? 'SALVANDO…' : contextoWizard === 'editar-treino' ? 'SALVAR ALTERAÇÕES' : 'SALVAR TREINO NA FICHA' }}
        </button>
      </div>

    </div>
    
  </div>
</template>
