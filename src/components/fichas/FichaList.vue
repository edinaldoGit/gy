<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFichaStore } from '@/stores/fichaStore'
import { Dumbbell, ChevronRight, Calendar, Coffee } from 'lucide-vue-next'

const store = useFichaStore()
const { fichasSalvas } = storeToRefs(store)
const { abrirNovaFicha, abrirDetalhes, getCorObj } = store

const diasDaSemanaBase = [
  { id: 0, nome: 'Domingo' },
  { id: 1, nome: 'Segunda-feira' },
  { id: 2, nome: 'Terça-feira' },
  { id: 3, nome: 'Quarta-feira' },
  { id: 4, nome: 'Quinta-feira' },
  { id: 5, nome: 'Sexta-feira' },
  { id: 6, nome: 'Sábado' },
]

const rotinaSemanal = computed(() => {
  return diasDaSemanaBase.map(dia => {
    const fichaEncontrada = fichasSalvas.value.find(f => f.diasDaSemana?.includes(dia.id))
    return { ...dia, ficha: fichaEncontrada }
  })
})

const fichasAvulsas = computed(() => {
  return fichasSalvas.value.filter(f => !f.diasDaSemana || f.diasDaSemana.length === 0)
})
</script>

<template>
  <div class="flex flex-col gap-6 animate-in slide-in-from-left-4 pb-12">
    
    <div class="px-2 mt-2">
      <h2 class="text-2xl font-black text-whitesmoke-950">Rotina Semanal</h2>
      <p class="text-sm text-whitesmoke-500 mt-1">Sua semana de treinos planejada.</p>
    </div>

    <!-- CALENDÁRIO DA SEMANA -->
    <div class="flex flex-col gap-4">
      <div v-for="dia in rotinaSemanal" :key="dia.id" class="flex flex-col gap-1.5">
        <span class="text-[10px] font-bold text-whitesmoke-400 uppercase tracking-widest pl-2 flex items-center gap-1.5">
          <Calendar :size="12" /> {{ dia.nome }}
        </span>
        
        <div 
          v-if="dia.ficha" 
          @click="abrirDetalhes(dia.ficha)"
          class="bg-white rounded-2xl p-4 shadow-sm border border-whitesmoke-200 flex items-center gap-4 cursor-pointer hover:border-whitesmoke-300 transition-colors relative overflow-hidden"
        >
          <div class="absolute left-0 top-0 bottom-0 w-1.5" :class="getCorObj(dia.ficha.corTema).bg"></div>
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-1.5" :class="[getCorObj(dia.ficha.corTema).light, getCorObj(dia.ficha.corTema).text]">
            <Dumbbell :size="20" />
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-bold text-whitesmoke-950 truncate">{{ dia.ficha.nome }}</h4>
            <p class="text-[10px] font-medium text-whitesmoke-500 mt-0.5">{{ dia.ficha.foco }} • {{ dia.ficha.exercicios.length }} ex</p>
          </div>
          <ChevronRight :size="18" class="text-whitesmoke-300" />
        </div>

        <div v-else class="bg-whitesmoke-50/50 rounded-2xl p-3 border border-whitesmoke-200 border-dashed flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-whitesmoke-100 text-whitesmoke-400 flex items-center justify-center shrink-0 ml-1.5">
            <Coffee :size="20" />
          </div>
          <div class="flex-1">
            <h4 class="text-sm font-bold text-whitesmoke-400">Descanso</h4>
          </div>
          <button 
            @click="abrirNovaFicha(dia.id)" 
            class="text-[10px] font-bold text-cerulean-600 bg-white border border-cerulean-100 px-3 py-1.5 rounded-xl shadow-sm hover:bg-cerulean-50 active:scale-95 transition-all"
          >
            + ADICIONAR
          </button>
        </div>

      </div>
    </div>

    <div v-if="fichasAvulsas.length > 0" class="mt-4 pt-6 border-t border-whitesmoke-200/50 flex flex-col gap-3">
      <h3 class="text-sm font-black text-whitesmoke-950 px-2 flex items-center justify-between">
        Treinos Avulsos
        <span class="text-[10px] font-bold bg-whitesmoke-100 text-whitesmoke-500 px-2 py-0.5 rounded-md">SEM DIA</span>
      </h3>
      
      <div 
        v-for="ficha in fichasAvulsas" :key="ficha.id" 
        @click="abrirDetalhes(ficha)"
        class="bg-white rounded-2xl p-4 shadow-sm border border-whitesmoke-200 flex items-center gap-4 cursor-pointer hover:border-whitesmoke-300 transition-colors relative overflow-hidden opacity-80 hover:opacity-100"
      >
        <div class="absolute left-0 top-0 bottom-0 w-1.5" :class="getCorObj(ficha.corTema).bg"></div>
        <div class="flex-1 min-w-0 ml-2">
          <h4 class="text-sm font-bold text-whitesmoke-950 truncate">{{ ficha.nome }}</h4>
          <p class="text-[10px] font-medium text-whitesmoke-500 mt-0.5">{{ ficha.foco }} • {{ ficha.exercicios.length }} ex</p>
        </div>
        <ChevronRight :size="18" class="text-whitesmoke-300" />
      </div>
    </div>

  </div>
</template>