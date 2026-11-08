<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFichaStore } from '@/stores/fichaStore'
import { Search, Plus, Check, ChevronRight, Dumbbell, Shield, Activity, Zap, Heart, Flame, Compass, Target } from 'lucide-vue-next'
import FichaWizardHeader from './FichaWizardHeader.vue'

const store = useFichaStore()
const { modo, termoBusca, fichaEditando, resultadosBusca, exerciciosAgrupados, modalCriarExAberto } = storeToRefs(store)
const { voltar, toggleExercicio, isExercicioSelecionado, getCorObj } = store

const categoriaAberta = ref<string | null>(null)
const filtroEquipamento = ref<string>('Todos')

// Cor do tema geral do treino (definida na Etapa 1)
const temaAtual = computed(() => getCorObj(fichaEditando.value.corTema || 'cerulean'))

// Mapeamento explícito de classes de seleção
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
    indigo: { border: 'border-indigo-500', bg: 'bg-indigo-50/30', text: 'bg-indigo-500 text-white', hex: '#6366f1' }
  }
  return map[id] || map['cerulean']
})

// Mapeamento de imagens locais para cada grupo muscular (com cores vivas reais)
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

// Ícones de fallback caso alguma imagem não esteja presente
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

// Garante que "Cardio" sempre apareça na lista de categorias
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
  <div class="flex flex-col gap-4 animate-in slide-in-from-right-4 h-[calc(100vh-120px)] relative bg-whitesmoke-50 rounded-t-[2.5rem]">
    
    <!-- HEADER EM PÍLULA -->
    <FichaWizardHeader 
      :titulo="categoriaAberta ? categoriaAberta : 'Catálogo'"
      subtitulo="Etapa 2 de 3"
      :corTemaBg="temaAtual.bg"
      :onVoltar="() => categoriaAberta ? fecharCategoria() : voltar()"
    >
      <template #acoes>
        <button 
          @click="modalCriarExAberto = true" 
          class="flex items-center gap-1.5 px-3.5 h-10 rounded-full bg-white text-whitesmoke-950 font-black text-xs shadow-sm transition-all hover:bg-whitesmoke-100 active:scale-95 shrink-0"
        >
          <Plus :size="16" stroke-width="3" :class="temaAtual.text" />
          <span>Novo Exercício</span>
        </button>
      </template>
    </FichaWizardHeader>

    <!-- BARRA DE BUSCA -->
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

    <div class="flex-1 overflow-y-auto px-4 pb-24">
      
      <!-- VISÃO 1: BUSCA GLOBAL -->
      <div v-if="termoBusca" class="flex flex-col gap-3 animate-in fade-in">
        <div class="grid grid-cols-2 gap-3">
          <div 
            v-for="ex in resultadosBusca" :key="ex.id"
            @click="toggleExercicio(ex)"
            class="bg-white p-3 rounded-[1.25rem] border-2 transition-all cursor-pointer select-none flex flex-col justify-between h-24 relative overflow-hidden shadow-sm"
            :class="isExercicioSelecionado(ex.id!) ? [classesSelecao.border, classesSelecao.bg] : 'border-whitesmoke-200 hover:border-whitesmoke-300'"
          >
            <div class="absolute right-3 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors z-10" :class="isExercicioSelecionado(ex.id!) ? [classesSelecao.text, 'border-transparent'] : 'border-whitesmoke-200 text-transparent bg-white'">
              <Check :size="12" stroke-width="3" />
            </div>
            
            <h4 class="text-[11px] font-bold text-whitesmoke-950 line-clamp-2 leading-tight pr-6 relative z-10">{{ ex.nome }}</h4>
            <div class="flex items-center gap-1.5 mt-2">
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white" :class="temaAtual.bg">{{ ex.grupoMuscular }}</span>
              <span class="text-[9px] font-bold text-whitesmoke-400 border border-whitesmoke-200 px-1.5 py-0.5 rounded-md">{{ ex.equipamento }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- VISÃO 2: CARDS DE GRUPOS MUSCULARES (Com Cardio e imagens completas) -->
      <div v-else-if="!categoriaAberta" class="grid grid-cols-2 gap-3 animate-in slide-in-from-left-4 duration-300">
        <div 
          v-for="(lista, grupo) in gruposComCardio" :key="grupo"
          @click="abrirCategoria(String(grupo))"
          class="bg-white rounded-[1.5rem] p-4 cursor-pointer relative overflow-hidden transition-all duration-300 active:scale-95 shadow-sm border border-whitesmoke-200 hover:border-whitesmoke-300 flex flex-col justify-between h-28 group"
        >
          <!-- IMAGEM DE FUNDO LATERAL DIREITA -->
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

          <!-- ÍCONE NO TOPO ESQUERDO -->
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

      <!-- VISÃO 3: DENTRO DA CATEGORIA -->
      <div v-else class="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
        <div class="flex overflow-x-auto gap-2 pb-1 -mx-4 px-4 no-scrollbar hide-scroll">
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

        <div class="grid grid-cols-2 gap-3">
          <div 
            v-for="ex in exerciciosFiltrados" :key="ex.id"
            @click="toggleExercicio(ex)"
            class="bg-white p-3 rounded-[1.25rem] border-2 transition-all cursor-pointer select-none flex flex-col justify-between h-24 relative overflow-hidden shadow-sm"
            :class="isExercicioSelecionado(ex.id!) ? [classesSelecao.border, classesSelecao.bg] : 'border-whitesmoke-200 hover:border-whitesmoke-300'"
          >
            <div class="absolute right-3 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors z-10" :class="isExercicioSelecionado(ex.id!) ? [classesSelecao.text, 'border-transparent'] : 'border-whitesmoke-200 text-transparent bg-white'">
              <Check :size="12" stroke-width="3" />
            </div>
            
            <h4 class="text-[11px] font-bold text-whitesmoke-950 line-clamp-2 leading-tight pr-6 relative z-10">{{ ex.nome }}</h4>
            <div class="flex items-center mt-2 relative z-10">
              <span class="text-[9px] font-bold text-whitesmoke-500 bg-whitesmoke-100 px-2 py-0.5 rounded-md border border-whitesmoke-200">{{ ex.equipamento }}</span>
            </div>
          </div>
        </div>

        <div v-if="exerciciosFiltrados.length === 0" class="flex flex-col items-center justify-center py-10 opacity-60">
          <Dumbbell :size="32" class="text-whitesmoke-400 mb-3" />
          <p class="text-sm font-bold text-whitesmoke-500">Nenhum exercício encontrado nesta categoria</p>
        </div>
      </div>

    </div>

    <!-- BOTÃO FLUTUANTE -->
    <div class="absolute bottom-6 left-0 right-0 px-4 z-20">
      <button 
        @click="modo = 'step3'"
        :disabled="(fichaEditando.exercicios?.length || 0) === 0"
        class="w-full text-white disabled:opacity-50 disabled:active:scale-100 font-black text-sm py-4 rounded-[1.25rem] flex items-center justify-between px-6 transition-all shadow-xl active:scale-[0.98]"
        :class="[temaAtual.bg, `hover:bg-${temaAtual.id}-600`, `shadow-${temaAtual.id}-500/30`]"
      >
        <span>{{ fichaEditando.exercicios?.length }} EXERCÍCIOS</span>
        <div class="flex items-center gap-2">CONFIGURAR SÉRIES <ChevronRight :size="18"/></div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.hide-scroll::-webkit-scrollbar { display: none; }
.hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-5px); }
</style>
