<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFichaStore } from '@/stores/fichaStore'
import { Search, Plus, ChevronRight, Dumbbell, Shield, Activity, Zap, Heart, Flame, Compass, Target } from 'lucide-vue-next'
import FichaWizardHeader from './FichaWizardHeader.vue'
import ExercicioSelecaoCard from './ExercicioSelecaoCard.vue'

const store = useFichaStore()
const { modo, termoBusca, fichaEditando, treinoEditando, resultadosBusca, exerciciosAgrupados, modalCriarExAberto } = storeToRefs(store)
const { voltar, toggleExercicio, isExercicioSelecionado, getCorObj } = store

const categoriaAberta = ref<string | null>(null)
const filtroEquipamento = ref<string>('Todos')
const temaAtual = computed(() => getCorObj(treinoEditando.value.corTema || 'cerulean'))

const classesSelecao = computed(() => {
  const id = temaAtual.value.id
  const map: Record<string, { border: string, bg: string, text: string, hex: string }> = {
    amethyst: { border: 'border-amethyst-500', bg: 'bg-amethyst-50/30', text: 'bg-amethyst-500 text-white', hex: '#9b5de5' },
    cerulean: { border: 'border-cerulean-500', bg: 'bg-cerulean-50/30', text: 'bg-cerulean-500 text-white', hex: '#00b4d8' },
    teal: { border: 'border-teal-500', bg: 'bg-teal-50/30', text: 'bg-teal-500 text-white', hex: '#00b4d8' },
    bubblegum: { border: 'border-bubblegum-500', bg: 'bg-bubblegum-50/30', text: 'bg-bubblegum-500 text-white', hex: '#ff70a6' },
    emerald: { border: 'border-emerald-500', bg: 'bg-emerald-50/30', text: 'bg-emerald-500 text-white', hex: '#2ec4b6' },
    orange: { border: 'border-orange-500', bg: 'bg-orange-50/30', text: 'bg-orange-500 text-white', hex: '#fb8500' },
    rose: { border: 'border-rose-500', bg: 'bg-rose-50/30', text: 'bg-rose-500 text-white', hex: '#ff5c8a' },
    amber: { border: 'border-amber-600', bg: 'bg-amber-50/30', text: 'bg-amber-600 text-white', hex: '#d97706' },
    slate: { border: 'border-slate-600', bg: 'bg-slate-50/30', text: 'bg-slate-600 text-white', hex: '#475569' },
    indigo: { border: 'border-indigo-500', bg: 'bg-indigo-50/30', text: 'bg-indigo-500 text-white', hex: '#6366f1' }
  }
  return map[id] || map['cerulean']
})

import peitoImg from '@/assets/peito.png'
import costasImg from '@/assets/costas.png'
import ombrosImg from '@/assets/ombros.png'
import bicepsImg from '@/assets/biceps.png'
import tricepsImg from '@/assets/triceps.png'
import pernasImg from '@/assets/pernas.png'
import abdomenImg from '@/assets/abdomen.png'
import panturrilhaImg from '@/assets/panturrilha.png'
import cardioImg from '@/assets/cardio.png'

const imagensGrupos: Record<string, string> = {
  'Peito': peitoImg,
  'Costas': costasImg,
  'Ombros': ombrosImg,
  'Bíceps': bicepsImg,
  'Tríceps': tricepsImg,
  'Pernas': pernasImg,
  'Abdômen': abdomenImg,
  'Panturrilha': panturrilhaImg,
  'Cardio': cardioImg
}

const iconesGrupos: Record<string, any> = {
  'Peito': Shield,
  'Costas': Target,
  'Pernas': Activity,
  'Ombros': Flame,
  'Tríceps': Zap,
  'Bíceps': Dumbbell,
  'Abdômen': Compass,
  'Panturrilha': Activity,
  'Cardio': Heart
}

const getIconeGrupo = (grupo: string) => {
  return iconesGrupos[grupo] || Dumbbell
}

const gruposComCardio = computed(() => {
  const agrupado = { ...exerciciosAgrupados.value }
  if (!agrupado['Cardio']) {
    agrupado['Cardio'] = []
  }
  return agrupado
})

const equipamentosDisponiveis = computed(() => {
  if (!categoriaAberta.value) return ['Todos']
  const lista = exerciciosAgrupados.value[categoriaAberta.value] || []
  const equips = new Set(lista.map(ex => ex.equipamento).filter(Boolean))
  return ['Todos', ...Array.from(equips).sort()]
})

const exerciciosFiltrados = computed(() => {
  if (termoBusca.value) return resultadosBusca.value 
  if (!categoriaAberta.value) return []
  
  let lista = exerciciosAgrupados.value[categoriaAberta.value] || []
  if (filtroEquipamento.value !== 'Todos') {
    lista = lista.filter(ex => ex.equipamento === filtroEquipamento.value)
  }
  return lista
})

const fecharCategoria = () => {
  categoriaAberta.value = null
  filtroEquipamento.value = 'Todos'
}

const abrirCategoria = (grupo: string) => {
  categoriaAberta.value = grupo
  filtroEquipamento.value = 'Todos'
}
</script>

<template>
  <div class="flex flex-col gap-4 animate-in slide-in-from-right-4 relative">
    
    <FichaWizardHeader 
      :titulo="categoriaAberta ? categoriaAberta : 'Selecionar exercícios'"
      :subtitulo="fichaEditando.nome"
      :onVoltar="() => categoriaAberta ? fecharCategoria() : voltar()"
    >
      <template #acoes>
        <button
          type="button"
          aria-label="Criar exercício"
          @click="modalCriarExAberto = true" 
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-whitesmoke-950 shadow-sm transition-all hover:bg-whitesmoke-100 active:scale-95 sm:w-auto sm:gap-1.5 sm:px-3.5"
        >
          <Plus :size="18" stroke-width="3" class="text-cerulean-600" />
          <span class="hidden text-xs font-black sm:inline">Novo Exercício</span>
        </button>
      </template>
    </FichaWizardHeader>

    <p class="px-4 text-xs font-semibold text-whitesmoke-500">Etapa 2 de 3 · Selecione os exercícios de {{ treinoEditando.nome }}</p>
    <div class="relative shrink-0 px-4 mt-2">
      <Search :size="18" class="absolute left-8 top-1/2 -translate-y-1/2 text-whitesmoke-400" />
      <input 
        v-model="termoBusca"
        type="text"
        placeholder="Buscar exercícios..."
        class="w-full bg-white border border-whitesmoke-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold text-whitesmoke-950 focus:outline-none shadow-sm transition-all placeholder:font-medium"
        :style="{ '--focus-color': classesSelecao.hex }"
        @focus="(e) => (e.target as HTMLElement).style.borderColor = classesSelecao.hex"
        @blur="(e) => (e.target as HTMLElement).style.borderColor = ''"
      />
    </div>

    <div class="px-4 pb-6">
      
      <div v-if="termoBusca" class="flex flex-col gap-3 animate-in fade-in">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <ExercicioSelecaoCard
            v-for="ex in resultadosBusca" :key="ex.id"
            :exercicio="ex"
            :selecionado="isExercicioSelecionado(ex.id!)"
            :imagem="imagensGrupos[ex.grupoMuscular]"
            :cor="classesSelecao.hex"
            :classes-selecao="classesSelecao"
            @selecionar="toggleExercicio(ex)"
          />
        </div>
      </div>

      <div v-else-if="!categoriaAberta" class="grid grid-cols-2 gap-3 animate-in slide-in-from-left-4 duration-300">
        <div 
          v-for="(lista, grupo) in gruposComCardio" :key="grupo"
          @click="abrirCategoria(String(grupo))"
          class="bg-white rounded-[1.5rem] p-4 cursor-pointer relative overflow-hidden transition-all duration-300 active:scale-95 shadow-sm border border-whitesmoke-200 hover:border-whitesmoke-300 flex flex-col justify-between h-28 group"
        >
          <template v-if="imagensGrupos[String(grupo)]">
            <div class="absolute right-0 top-0 h-full z-0 pointer-events-none overflow-hidden flex items-center justify-end">
              <img 
                :src="imagensGrupos[String(grupo)]" 
                :alt="String(grupo)" 
                class="h-full w-auto object-cover object-right"
              />
              <div class="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent"></div>
            </div>
          </template>

          <div class="flex items-center justify-between relative z-10">
            <span v-if="!imagensGrupos[String(grupo)]" class="w-9 h-9 rounded-2xl bg-whitesmoke-100 flex items-center justify-center text-whitesmoke-700 group-hover:scale-110 transition-transform shadow-sm">
              <component :is="getIconeGrupo(String(grupo))" :size="18" stroke-width="2.2" />
            </span>
            <div v-else></div>
            <ChevronRight :size="16" class="text-whitesmoke-300 group-hover:translate-x-0.5 transition-transform" />
          </div>

          <div class="relative z-10">
            <h3 class="text-sm font-black text-whitesmoke-950 leading-tight tracking-tight">{{ grupo }}</h3>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-whitesmoke-100/90 text-whitesmoke-500 backdrop-blur-xs">
                {{ lista.length }} {{ lista.length === 1 ? 'opção' : 'opções' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
        <div class="flex overflow-x-auto gap-2 pb-1 -mx-4 px-4 gy-scrollbar-hidden">
          <button 
            v-for="equip in equipamentosDisponiveis" :key="equip"
            @click="filtroEquipamento = equip"
            class="px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all whitespace-nowrap border shrink-0"
            :class="filtroEquipamento === equip 
              ? [temaAtual.bg, 'border-transparent text-white shadow-sm'] 
              : 'bg-white border-whitesmoke-200 text-whitesmoke-500 hover:bg-whitesmoke-100'"
          >
            {{ equip }}
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <ExercicioSelecaoCard
            v-for="ex in exerciciosFiltrados" :key="ex.id"
            :exercicio="ex"
            :selecionado="isExercicioSelecionado(ex.id!)"
            :imagem="imagensGrupos[ex.grupoMuscular]"
            :cor="classesSelecao.hex"
            :classes-selecao="classesSelecao"
            @selecionar="toggleExercicio(ex)"
          />
        </div>

        <div v-if="exerciciosFiltrados.length === 0" class="flex flex-col items-center justify-center py-10 opacity-60">
          <Dumbbell :size="32" class="text-whitesmoke-400 mb-3" />
          <p class="text-sm font-bold text-whitesmoke-500">Nenhum exercício encontrado nesta categoria</p>
        </div>
      </div>

    </div>

    <div class="px-4 pb-4">
      <button 
        @click="modo = 'step3'"
        :disabled="!treinoEditando.nome.trim() || (treinoEditando.exercicios?.length || 0) === 0"
        class="flex w-full items-center justify-between rounded-[1.25rem] bg-cerulean-500 px-6 py-4 text-sm font-black text-white transition-all hover:bg-cerulean-600 active:scale-[0.98] disabled:active:scale-100 disabled:opacity-50"
      >
        <span>{{ treinoEditando.exercicios?.length }} EXERCÍCIOS</span>
        <div class="flex items-center gap-2">AJUSTAR SÉRIES <ChevronRight :size="18"/></div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-5px); }
</style>
