<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useFichaStore } from '@/stores/fichaStore'
import { Search, ArrowLeft, Plus, Check, ChevronRight } from 'lucide-vue-next'

const store = useFichaStore()
const { modo, termoBusca, fichaEditando, resultadosBusca, exerciciosAgrupados, modalCriarExAberto } = storeToRefs(store)
const { voltar, toggleExercicio, isExercicioSelecionado, getCorObj } = store
</script>

<template>
  <div class="flex flex-col gap-4 animate-in slide-in-from-right-4 h-[calc(100vh-120px)] relative">
    <div class="flex items-center gap-4 px-2 mt-2 shrink-0">
      <button @click="voltar" class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-whitesmoke-200 text-whitesmoke-700">
        <ArrowLeft :size="20" />
      </button>
      <div class="flex-1 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-whitesmoke-950">Catálogo</h2>
          <p class="text-[10px] font-bold text-cerulean-500 uppercase tracking-widest mt-0.5">Etapa 2 de 3</p>
        </div>
        <button @click="modalCriarExAberto = true" class="flex items-center gap-1.5 bg-cerulean-50 text-cerulean-600 px-3 py-1.5 rounded-xl font-bold text-[11px] hover:bg-cerulean-100 transition-colors shadow-sm border border-cerulean-100">
          <Plus :size="14" stroke-width="3" /> NOVO
        </button>
      </div>
    </div>

    <div class="relative shrink-0 px-2">
      <Search :size="18" class="absolute left-6 top-1/2 -translate-y-1/2 text-whitesmoke-400" />
      <input 
        v-model="termoBusca"
        type="text"
        placeholder="Pesquisar exercícios..."
        class="w-full bg-white border border-whitesmoke-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium text-whitesmoke-950 focus:outline-none focus:border-cerulean-500 focus:ring-2 focus:ring-cerulean-500/20 shadow-sm"
      />
    </div>

    <div class="flex-1 overflow-y-auto px-2 pb-24">
      <div v-if="termoBusca" class="flex flex-col gap-3 mt-4">
        <div class="grid grid-cols-2 gap-3">
          <div 
            v-for="ex in resultadosBusca" 
            :key="ex.id"
            @click="toggleExercicio(ex)"
            class="bg-white p-3 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between h-24 relative overflow-hidden"
            :class="isExercicioSelecionado(ex.id!) ? `border-cerulean-500 bg-cerulean-50/30` : 'border-whitesmoke-200 hover:border-cerulean-300'"
          >
            <div v-if="isExercicioSelecionado(ex.id!)" class="absolute -right-5 -top-5 w-10 h-10 bg-cerulean-500 rotate-45"></div>
            <Check v-if="isExercicioSelecionado(ex.id!)" :size="10" class="absolute top-1 right-1 text-white" stroke-width="4" />
            
            <h4 class="text-xs font-bold text-whitesmoke-950 line-clamp-2 leading-tight pr-2">{{ ex.nome }}</h4>
            <div class="flex items-center justify-between mt-2">
              <span class="text-[9px] font-bold uppercase tracking-widest text-whitesmoke-400">{{ ex.grupoMuscular }}</span>
            </div>
          </div>
        </div>

        <div class="mt-6 flex flex-col items-center justify-center p-6 bg-cerulean-50/50 rounded-3xl border border-cerulean-100 border-dashed">
          <p v-if="resultadosBusca.length === 0" class="text-sm font-bold text-whitesmoke-700 text-center mb-3">
            Não achou o "{{ termoBusca }}"?
          </p>
          <p v-else class="text-xs font-bold text-whitesmoke-500 text-center mb-3">
            Faltou algum na lista?
          </p>
          <button 
            @click="modalCriarExAberto = true"
            class="bg-white text-cerulean-600 border border-cerulean-200 font-bold text-xs py-2.5 px-6 rounded-xl shadow-sm hover:bg-cerulean-100 transition-colors flex items-center gap-2"
          >
            <Plus :size="16" /> CRIAR EXERCÍCIO
          </button>
        </div>
      </div>

      <div v-else class="flex flex-col gap-6 mt-4">
        <div v-for="(lista, grupo) in exerciciosAgrupados" :key="grupo">
          <h3 class="text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            {{ grupo }}
            <div class="flex-1 h-px bg-whitesmoke-200"></div>
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div 
              v-for="ex in lista" 
              :key="ex.id"
              @click="toggleExercicio(ex)"
              class="bg-white p-3 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between h-24 relative overflow-hidden"
              :class="isExercicioSelecionado(ex.id!) ? 'border-cerulean-500 bg-cerulean-50/30 shadow-sm' : 'border-whitesmoke-200 hover:border-cerulean-300 shadow-sm'"
            >
              <div v-if="isExercicioSelecionado(ex.id!)" class="absolute -right-5 -top-5 w-10 h-10 bg-cerulean-500 rotate-45"></div>
              <Check v-if="isExercicioSelecionado(ex.id!)" :size="10" class="absolute top-1 right-1 text-white" stroke-width="4" />
              <h4 class="text-xs font-bold text-whitesmoke-950 line-clamp-2 leading-tight relative z-10 pr-2">{{ ex.nome }}</h4>
              <div class="flex items-center gap-1 mt-2">
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-whitesmoke-100 text-whitesmoke-500">{{ ex.equipamento }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-4 left-0 right-0 px-2 z-20">
      <button 
        @click="modo = 'step3'"
        :disabled="(fichaEditando.exercicios?.length || 0) === 0"
        class="w-full text-white disabled:opacity-50 disabled:active:scale-100 font-black text-sm py-4 rounded-2xl flex items-center justify-between px-6 transition-all shadow-xl active:scale-[0.98]"
        :class="getCorObj(fichaEditando.corTema!).bg"
      >
        <span>{{ fichaEditando.exercicios?.length }} EXERCÍCIOS</span>
        <div class="flex items-center gap-2">CONFIGURAR SÉRIES <ChevronRight :size="18"/></div>
      </button>
    </div>
  </div>
</template>