<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useFichaStore } from '@/stores/fichaStore'
import { ArrowLeft, Clock, Check, Trash2, Save } from 'lucide-vue-next'

const store = useFichaStore()
const { fichaEditando, descansoGlobal } = storeToRefs(store)
const { voltar, removerExercicioDaFicha, aplicarDescansoGlobal, salvarFicha, getCorObj } = store
</script>

<template>
  <div class="flex flex-col gap-6 animate-in slide-in-from-right-4">
    <div class="flex items-center gap-4 px-2 mt-2">
      <button @click="voltar" class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-whitesmoke-200 text-whitesmoke-700">
        <ArrowLeft :size="20" />
      </button>
      <div>
        <h2 class="text-xl font-black text-whitesmoke-950">Ajuste Fino</h2>
        <p class="text-[10px] font-bold text-cerulean-500 uppercase tracking-widest mt-0.5">Etapa Final</p>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <div class="bg-white rounded-3xl p-4 shadow-sm border border-whitesmoke-200 flex items-center justify-between">
        <div>
          <h4 class="text-sm font-bold text-whitesmoke-950 flex items-center gap-1.5"><Clock :size="16" class="text-whitesmoke-500"/> Descanso Global</h4>
          <p class="text-[10px] text-whitesmoke-500 mt-0.5">Aplicar em todos os exercícios</p>
        </div>
        <div class="flex items-center gap-2">
          <input type="number" v-model.number="descansoGlobal" class="w-14 bg-whitesmoke-50 rounded-xl px-2 py-2 text-center font-bold text-sm border border-whitesmoke-200 outline-none focus:border-cerulean-500 focus:ring-1 focus:ring-cerulean-500" />
          <span class="text-xs font-bold text-whitesmoke-400">seg</span>
          <button @click="aplicarDescansoGlobal" class="bg-whitesmoke-100 p-2 rounded-xl text-whitesmoke-700 hover:bg-whitesmoke-200 transition-colors active:scale-95">
            <Check :size="16" stroke-width="3" />
          </button>
        </div>
      </div>

      <div 
        v-for="(ex, index) in fichaEditando.exercicios" 
        :key="index"
        class="bg-white rounded-3xl p-4 shadow-sm border border-whitesmoke-200 relative"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black" :class="[getCorObj(fichaEditando.corTema!).light, getCorObj(fichaEditando.corTema!).text]">
              {{ index + 1 }}
            </div>
            <div>
              <h4 class="text-sm font-bold text-whitesmoke-950 pr-4">{{ (ex as any)._nomeDisplay }}</h4>
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
          <div class="bg-cerulean-50/50 rounded-xl p-2 border border-cerulean-100 flex flex-col items-center">
            <span class="block text-[9px] font-bold text-cerulean-600 uppercase tracking-wider mb-1">Taxa (+kg)</span>
            <input type="number" v-model.number="ex.taxaAumentoKg" class="w-full bg-transparent text-center font-semibold text-cerulean-700 text-sm outline-none" />
          </div>
          <div class="bg-teal-50/50 rounded-xl p-2 border border-teal-100 flex flex-col items-center">
            <span class="block text-[9px] font-bold text-teal-600 uppercase tracking-wider mb-1">Pausa (s)</span>
            <input type="number" v-model.number="ex.descansoSegundos" class="w-full bg-transparent text-center font-semibold text-teal-700 text-sm outline-none" />
          </div>
        </div>
      </div>
    </div>

    <button 
      @click="salvarFicha"
      class="w-full text-white font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] mt-2"
      :class="getCorObj(fichaEditando.corTema!).bg"
    >
      <Save :size="22" />
      SALVAR TREINO
    </button>
  </div>
</template>