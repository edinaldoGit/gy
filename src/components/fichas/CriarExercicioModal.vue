<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useFichaStore } from '@/stores/fichaStore'
import { X, Link2, Plus } from 'lucide-vue-next'

const store = useFichaStore()
const { modalCriarExAberto, novoEx } = storeToRefs(store)
const { salvarNovoExercicio } = store

const gruposMusculares = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Cardio', 'Outro']
const equipamentos = ['Barra', 'Halter', 'Máquina', 'Polia', 'Peso Corporal', 'Outro']
</script>

<template>
  <div class="fixed inset-0 z-40 bg-whitesmoke-950/20 backdrop-blur-sm animate-in fade-in duration-300" @click="modalCriarExAberto = false"></div>

  <div class="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-whitesmoke-50 rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.15)] max-h-[80vh] animate-in slide-in-from-bottom-full duration-300">
    <div class="w-full flex justify-center pt-3 pb-1">
      <div class="w-12 h-1.5 bg-whitesmoke-200 rounded-full"></div>
    </div>

    <div class="bg-whitesmoke-50 px-6 py-4 flex items-center justify-between relative z-10 border-b border-whitesmoke-200/50">
      <h3 class="font-black text-whitesmoke-950 text-lg">Criar Exercício</h3>
      <button @click="modalCriarExAberto = false" class="p-2 bg-white shadow-sm border border-whitesmoke-200 rounded-full text-whitesmoke-500 hover:text-whitesmoke-950">
        <X :size="18" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
      <div>
        <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-1.5">Nome do Exercício</label>
        <input v-model="novoEx.nome" type="text" placeholder="Ex: Cadeira Adutora" class="w-full bg-white border border-whitesmoke-200 rounded-2xl px-4 py-3 text-whitesmoke-950 font-medium focus:outline-none focus:border-cerulean-500 focus:ring-2 focus:ring-cerulean-500/20" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-1.5">Músculo</label>
          <select v-model="novoEx.grupoMuscular" class="w-full bg-white border border-whitesmoke-200 rounded-2xl px-4 py-3 text-whitesmoke-950 font-medium focus:outline-none focus:border-cerulean-500 focus:ring-2 focus:ring-cerulean-500/20 appearance-none">
            <option v-for="grupo in gruposMusculares" :key="grupo" :value="grupo">{{ grupo }}</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-1.5">Equipamento</label>
          <select v-model="novoEx.equipamento" class="w-full bg-white border border-whitesmoke-200 rounded-2xl px-4 py-3 text-whitesmoke-950 font-medium focus:outline-none focus:border-cerulean-500 focus:ring-2 focus:ring-cerulean-500/20 appearance-none">
            <option v-for="eq in equipamentos" :key="eq" :value="eq">{{ eq }}</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-1.5 text-center">Séries Padrão</label>
          <input v-model.number="novoEx.defaultSeries" type="number" class="w-full bg-white border border-whitesmoke-200 rounded-2xl px-4 py-3 text-whitesmoke-950 font-medium text-center focus:outline-none focus:border-cerulean-500 focus:ring-2 focus:ring-cerulean-500/20" />
        </div>
        <div>
          <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-1.5 text-center">Reps Padrão</label>
          <input v-model="novoEx.defaultReps" type="text" placeholder="Ex: 8-12" class="w-full bg-white border border-whitesmoke-200 rounded-2xl px-4 py-3 text-whitesmoke-950 font-medium text-center focus:outline-none focus:border-cerulean-500 focus:ring-2 focus:ring-cerulean-500/20" />
        </div>
      </div>

      <div>
        <label class="block text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
          <Link2 :size="14" /> Link do YouTube (Opcional)
        </label>
        <input v-model="novoEx.videoUrl" type="url" placeholder="Em branco para gerar automático" class="w-full bg-white border border-whitesmoke-200 rounded-2xl px-4 py-3 text-whitesmoke-600 font-medium text-sm focus:outline-none focus:border-cerulean-500 focus:ring-2 focus:ring-cerulean-500/20" />
        <p class="text-[9px] text-whitesmoke-400 mt-1.5 leading-tight text-center">
          Deixe em branco para criarmos a busca do vídeo baseada no nome.
        </p>
      </div>

      <div class="mt-4 pb-8">
        <button @click="salvarNovoExercicio" class="w-full bg-cerulean-500 hover:bg-cerulean-600 text-white font-black text-base py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]">
          <Plus :size="20" stroke-width="3" /> ADICIONAR AO CATÁLOGO
        </button>
      </div>
    </div>
  </div>
</template>