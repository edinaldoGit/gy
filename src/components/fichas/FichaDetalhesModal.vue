<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useFichaStore } from '@/stores/fichaStore'
import { X, Edit2, Trash2, Calendar, Flame } from 'lucide-vue-next'

const store = useFichaStore()
const { modalDetalhesAberto, fichaSelecionada, catalogo } = storeToRefs(store)
const { editarFichaSelecionada, deletarFichaSelecionada, getCorObj } = store

const labelsDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const formatarDias = (dias?: number[]) => {
  if (!dias || dias.length === 0) return 'Sem dia fixo'
  if (dias.length === 7) return 'Todos os dias'
  return [...dias].sort().map(d => labelsDias[d]).join(', ')
}

const confirmarDelete = () => {
  if (confirm(`Tem certeza que deseja excluir o ${fichaSelecionada.value?.nome}?`)) {
    deletarFichaSelecionada()
  }
}

const getNomeExercicio = (id: number) => {
  const ex = catalogo.value.find(c => c.id === id)
  return ex ? ex.nome : 'Exercício Desconhecido'
}
</script>

<template>
  <div class="fixed inset-0 z-40 bg-whitesmoke-950/20 backdrop-blur-sm animate-in fade-in duration-300" @click="modalDetalhesAberto = false"></div>
  <div v-if="fichaSelecionada" class="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-whitesmoke-50 rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] overflow-hidden">
    <div class="shrink-0 relative" :class="getCorObj(fichaSelecionada.corTema).bg">
      <div class="w-full flex justify-center pt-3 pb-2">
        <div class="w-12 h-1.5 bg-white/30 rounded-full"></div>
      </div>

      <div class="px-6 pb-5 flex items-start justify-between text-white border-b border-white/10">
        <div class="relative z-10">
          <span class="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest mb-1 inline-block">Treino</span>
          <h3 class="font-black text-2xl leading-none mt-1">{{ fichaSelecionada.nome }}</h3>
          <p class="text-white/80 font-medium text-sm mt-1.5">{{ fichaSelecionada.foco }}</p>
        </div>
        <button @click="modalDetalhesAberto = false" class="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors relative z-10 mt-1">
          <X :size="20" />
        </button>
      </div>
    </div>

    <div class="p-6 flex flex-col gap-6 overflow-y-auto">
      
      <div class="flex items-center gap-4 bg-white p-4 rounded-2xl border border-whitesmoke-200 shadow-sm shrink-0">
        <div class="flex-1 flex flex-col items-center border-r border-whitesmoke-100">
          <Calendar :size="18" class="text-whitesmoke-400 mb-1" />
          <span class="text-[10px] font-bold text-whitesmoke-500 uppercase tracking-widest text-center">{{ formatarDias(fichaSelecionada.diasDaSemana) }}</span>
        </div>
        <div class="flex-1 flex flex-col items-center">
          <Flame :size="18" class="text-whitesmoke-400 mb-1" />
          <span class="text-[10px] font-bold text-whitesmoke-500 uppercase tracking-widest text-center">{{ fichaSelecionada.exercicios.length }} Exercícios</span>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <h4 class="text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest px-1">Exercícios Deste Treino</h4>
        <div class="bg-white rounded-2xl border border-whitesmoke-200 shadow-sm overflow-hidden">
          <div 
            v-for="(ex, index) in fichaSelecionada.exercicios" 
            :key="ex.exercicioId"
            class="flex items-center justify-between px-4 py-3 border-b border-whitesmoke-50 last:border-0"
          >
            <div class="flex items-center gap-3 truncate pr-2">
              <span class="text-xs font-black text-whitesmoke-300 w-4 text-right">{{ index + 1 }}</span>
              <span class="text-sm font-bold text-whitesmoke-950 truncate">{{ getNomeExercicio(ex.exercicioId) }}</span>
            </div>
            <div class="bg-whitesmoke-100 px-2 py-1 rounded-lg shrink-0">
              <span class="text-[10px] font-black text-whitesmoke-500 uppercase tracking-widest">{{ ex.series }}x {{ ex.repsAlvo }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 pb-6 mt-2 shrink-0">
        <button @click="confirmarDelete" class="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all shadow-sm">
          <Trash2 :size="24" />
        </button>
        <button @click="editarFichaSelecionada" class="flex-1 text-white font-black text-lg h-14 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]" :class="getCorObj(fichaSelecionada.corTema).bg">
          <Edit2 :size="20" /> EDITAR FICHA
        </button>
      </div>

    </div>
  </div>
</template>