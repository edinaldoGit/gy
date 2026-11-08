<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFichaStore } from '@/stores/fichaStore'
import { Clock, Check, Trash2, Save, Timer } from 'lucide-vue-next'
import FichaWizardHeader from './FichaWizardHeader.vue'

const store = useFichaStore()
const { fichaEditando, descansoGlobal } = storeToRefs(store)
const { voltar, removerExercicioDaFicha, salvarFicha, getCorObj } = store

const aplicarDescansoLocal = () => {
  if (!fichaEditando.value.exercicios) return
  fichaEditando.value.exercicios.forEach((ex: any) => {
    if (ex.temDescanso !== false) {
      ex.descansoSegundos = descansoGlobal.value
    }
  })
}

const toggleDescansoExercicio = (ex: any) => {
  ex.temDescanso = ex.temDescanso === false ? true : false
}

const temaAtual = computed(() => getCorObj(fichaEditando.value.corTema || 'cerulean'))
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-120px)] relative bg-whitesmoke-50 rounded-t-[2.5rem] overflow-hidden">
    
    <!-- HEADER FIXO NO TOPO -->
    <div class="shrink-0 pb-2">
      <FichaWizardHeader 
        titulo="Ajuste Fino"
        subtitulo="Etapa Final"
        :corTemaBg="temaAtual.bg"
        :onVoltar="voltar"
      />
    </div>

    <!-- ÁREA DE ROLAGEM ÚNICA (Cards + Botão no mesmo fluxo) -->
    <div class="flex-1 overflow-y-auto px-4 pt-1 pb-6 flex flex-col gap-4">
      
      <!-- PAINEL GLOBAL -->
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
            v-model.number="descansoGlobal" 
            class="w-14 bg-whitesmoke-50 rounded-xl px-2 py-2 text-center font-bold text-sm border border-whitesmoke-200 outline-none focus:ring-2 focus:border-whitesmoke-300 focus:ring-whitesmoke-200 transition-all" 
          />
          <span class="text-xs font-bold text-whitesmoke-400">s</span>
          <button 
            @click="aplicarDescansoLocal" 
            class="p-2 rounded-xl text-white transition-colors active:scale-95 shadow-sm"
            :class="[temaAtual.bg]"
          >
            <Check :size="16" stroke-width="3" />
          </button>
        </div>
      </div>

      <!-- LISTA DE EXERCÍCIOS -->
      <div 
        v-for="(ex, index) in fichaEditando.exercicios" 
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
              <h4 class="text-sm font-bold text-whitesmoke-950 pr-4 truncate max-w-[180px]">{{ (ex as any)._nomeDisplay }}</h4>
              <p class="text-[10px] font-bold text-whitesmoke-400 uppercase tracking-widest mt-0.5">{{ (ex as any)._grupoDisplay }}</p>
            </div>
          </div>
          <button @click="removerExercicioDaFicha(index)" class="text-red-400 p-2 hover:bg-red-50 rounded-xl transition-colors shrink-0">
            <Trash2 :size="16" />
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="bg-whitesmoke-50 rounded-xl p-2 border border-whitesmoke-100 flex flex-col items-center">
            <span class="block text-[9px] font-bold text-whitesmoke-400 uppercase tracking-wider mb-1">Séries</span>
            <input type="number" v-model.number="ex.series" class="w-full bg-transparent text-center font-semibold text-whitesmoke-950 text-sm outline-none" />
          </div>
          <div class="bg-whitesmoke-50 rounded-xl p-2 border border-whitesmoke-100 flex flex-col items-center">
            <span class="block text-[9px] font-bold text-whitesmoke-400 uppercase tracking-wider mb-1">Reps Alvo</span>
            <input type="text" v-model="ex.repsAlvo" class="w-full bg-transparent text-center font-semibold text-whitesmoke-950 text-sm outline-none" />
          </div>
          
          <div class="bg-whitesmoke-50 rounded-xl p-2 border border-whitesmoke-100 flex flex-col items-center">
            <span class="block text-[9px] font-bold text-whitesmoke-400 uppercase tracking-wider mb-1">Taxa (+kg)</span>
            <input type="number" v-model.number="ex.taxaAumentoKg" class="w-full bg-transparent text-center font-semibold text-whitesmoke-950 text-sm outline-none" />
          </div>
          
          <!-- CONTROLE INDIVIDUAL DE DESCANSO -->
          <div class="bg-teal-50/50 rounded-xl p-2 border flex flex-col items-center justify-between" :class="(ex as any).temDescanso !== false ? 'border-teal-100' : 'border-whitesmoke-200 grayscale opacity-50'">
            <div class="w-full flex items-center justify-between px-1">
              <Timer :size="12" class="text-teal-600" />
              <button @click="toggleDescansoExercicio(ex)" class="w-8 h-4 rounded-full p-0.5 transition-colors" :class="(ex as any).temDescanso !== false ? 'bg-teal-500' : 'bg-whitesmoke-300'">
                <div class="w-3 h-3 bg-white rounded-full transition-transform" :class="(ex as any).temDescanso !== false ? 'translate-x-4' : 'translate-x-0'"></div>
              </button>
            </div>
            <div class="flex items-end gap-1 mt-1">
              <input type="number" v-model.number="ex.descansoSegundos" :disabled="(ex as any).temDescanso === false" class="w-10 bg-transparent text-center font-semibold text-teal-700 text-sm outline-none disabled:bg-transparent" />
              <span class="text-[9px] font-bold text-teal-600 uppercase tracking-wider pb-1">seg</span>
            </div>
          </div>
        </div>
      </div>

      <!-- BOTÃO SALVAR (Agora dentro da rolagem, logo após o último card) -->
      <div class="mt-2 mb-4">
        <button 
          @click="salvarFicha"
          class="w-full text-white font-black text-sm py-4 rounded-[1.25rem] flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
          :class="[temaAtual.bg, `hover:bg-${temaAtual.id}-600`]"
        >
          <Save :size="20" />
          SALVAR TREINO
        </button>
      </div>

    </div>
    
  </div>
</template>