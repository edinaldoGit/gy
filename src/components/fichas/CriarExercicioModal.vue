<script setup lang="ts">
import ModalSheetHeader from '@/components/layout/ModalSheetHeader.vue'
import { modalSheetBackdrop, modalSheetPanel } from '@/components/layout/modalSheetStyles'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFichaStore } from '@/stores/fichaStore'
import { Link2, Plus } from 'lucide-vue-next'

const store = useFichaStore()
const { modalCriarExAberto, novoEx, fichaEditando } = storeToRefs(store)
const { salvarNovoExercicio, getCorObj } = store

const gruposMusculares = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Cardio', 'Outro']
const equipamentos = ['Barra', 'Halter', 'Máquina', 'Polia', 'Peso Corporal', 'Outro']

const temaAtual = computed(() => getCorObj(fichaEditando.value.corTema || 'cerulean'))
</script>

<template>
  <div :class="modalSheetBackdrop" @click.self="!store.criandoExercicio && (modalCriarExAberto = false)">

  <div role="dialog" aria-modal="true" aria-labelledby="criar-exercicio-titulo" :class="modalSheetPanel">
    <ModalSheetHeader titulo="Criar Exercício" subtitulo="Adicione um exercício ao seu catálogo." etiqueta="Catálogo" cor-classe="bg-cerulean-600" titulo-id="criar-exercicio-titulo" :desabilitado="store.criandoExercicio" @fechar="modalCriarExAberto = false" />

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

      <p v-if="store.erroExercicio" role="alert" class="rounded-xl bg-bubblegum-50 p-3 text-sm text-bubblegum-700">{{ store.erroExercicio }}</p>
      <div class="mt-4 pb-8">
        <button
          :disabled="store.criandoExercicio" :aria-busy="store.criandoExercicio" @click="salvarNovoExercicio"
          class="w-full text-white font-black text-base py-4 rounded-[1.25rem] flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
          :class="[temaAtual.bg]"
        >
          <Plus :size="20" stroke-width="3" /> {{ store.criandoExercicio ? 'Salvando…' : 'ADICIONAR AO CATÁLOGO' }}
        </button>
      </div>
    </div>
  </div>
  </div>
</template>
