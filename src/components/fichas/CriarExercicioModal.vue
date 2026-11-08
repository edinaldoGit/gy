<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFichaStore } from '@/stores/fichaStore'
import { X, Link2, Plus } from 'lucide-vue-next'

const store = useFichaStore()
const { modalCriarExAberto, novoEx, fichaEditando } = storeToRefs(store)
const { salvarNovoExercicio, getCorObj } = store

const gruposMusculares = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Cardio', 'Outro']
const equipamentos = ['Barra', 'Halter', 'Máquina', 'Polia', 'Peso Corporal', 'Outro']

// Computa a cor atual selecionada na Etapa 1
const temaAtual = computed(() => getCorObj(fichaEditando.value.corTema || 'cerulean'))
</script>

<template>
  <div class="fixed inset-0 z-40 bg-whitesmoke-950/20 backdrop-blur-sm animate-in fade-in duration-300" @click="modalCriarExAberto = false"></div>

  <div class="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-whitesmoke-50 rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.15)] max-h-[85vh] animate-in slide-in-from-bottom-full duration-300">
    <div class="w-full flex justify-center pt-3 pb-1 shrink-0">
      <div class="w-12 h-1.5 bg-whitesmoke-200 rounded-full"></div>
    </div>

    <!-- HEADER EM PÍLULA -->
    <div class="px-4 pt-2 pb-2 shrink-0">
      <div 
        class="flex items-center justify-between px-4 py-3 rounded-[2rem] shadow-sm transition-colors duration-500"
        :class="temaAtual.bg"
      >
        <h3 class="font-black text-white text-lg ml-1">Criar Exercício</h3>
        <button @click="modalCriarExAberto = false" class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors shrink-0">
          <X :size="20" class="text-white" />
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-6 pb-6 pt-4 flex flex-col gap-5">
      <div>
        <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-1.5">Nome do Exercício</label>
        <input 
          v-model="novoEx.nome" 
          type="text" 
          placeholder="Ex: Cadeira Adutora" 
          class="w-full bg-white border border-whitesmoke-200 rounded-2xl px-4 py-3 text-whitesmoke-950 font-medium focus:outline-none focus:border-whitesmoke-300 focus:ring-2 focus:ring-whitesmoke-200 transition-all"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-1.5">Músculo</label>
          <select 
            v-model="novoEx.grupoMuscular" 
            class="w-full bg-white border border-whitesmoke-200 rounded-2xl px-4 py-3 text-whitesmoke-950 font-medium focus:outline-none focus:border-whitesmoke-300 focus:ring-2 focus:ring-whitesmoke-200 appearance-none transition-all"
          >
            <option v-for="grupo in gruposMusculares" :key="grupo" :value="grupo">{{ grupo }}</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-1.5">Equipamento</label>
          <select 
            v-model="novoEx.equipamento" 
            class="w-full bg-white border border-whitesmoke-200 rounded-2xl px-4 py-3 text-whitesmoke-950 font-medium focus:outline-none focus:border-whitesmoke-300 focus:ring-2 focus:ring-whitesmoke-200 appearance-none transition-all"
          >
            <option v-for="eq in equipamentos" :key="eq" :value="eq">{{ eq }}</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-1.5 text-center">Séries Padrão</label>
          <input 
            v-model.number="novoEx.defaultSeries" 
            type="number" 
            class="w-full bg-white border border-whitesmoke-200 rounded-2xl px-4 py-3 text-whitesmoke-950 font-medium text-center focus:outline-none focus:border-whitesmoke-300 focus:ring-2 focus:ring-whitesmoke-200 transition-all" 
          />
        </div>
        <div>
          <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-1.5 text-center">Reps Padrão</label>
          <input 
            v-model="novoEx.defaultReps" 
            type="text" 
            placeholder="Ex: 8-12" 
            class="w-full bg-white border border-whitesmoke-200 rounded-2xl px-4 py-3 text-whitesmoke-950 font-medium text-center focus:outline-none focus:border-whitesmoke-300 focus:ring-2 focus:ring-whitesmoke-200 transition-all" 
          />
        </div>
      </div>

      <div>
        <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
          <Link2 :size="14" class="text-whitesmoke-400" /> Link do YouTube (Opcional)
        </label>
        <input 
          v-model="novoEx.videoUrl" 
          type="url" 
          placeholder="Em branco para busca automática" 
          class="w-full bg-white border border-whitesmoke-200 rounded-2xl px-4 py-3 text-whitesmoke-600 font-medium text-sm focus:outline-none focus:border-whitesmoke-300 focus:ring-2 focus:ring-whitesmoke-200 transition-all" 
        />
      </div>

      <div class="mt-4 pb-8">
        <button 
          @click="salvarNovoExercicio" 
          class="w-full text-white font-black text-base py-4 rounded-[1.25rem] flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
          :class="[temaAtual.bg]"
        >
          <Plus :size="20" stroke-width="3" /> ADICIONAR AO CATÁLOGO
        </button>
      </div>
    </div>
  </div>
</template>