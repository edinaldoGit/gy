<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Play, Dumbbell, Clock, Flame, ChevronRight, 
  CheckCircle2, ChevronDown, RefreshCw, LineChart, Check,
  CheckCheck, RotateCcw, Trophy, ArrowRightLeft
} from 'lucide-vue-next'

const isTreinoAtivo = ref(false)
const treinoFinalizadoHoje = ref(false)
const exercicioExpandido = ref<number | null>(1)
const cronometro = ref('00:00')
const mockTreinoA = {
  id: 1, nome: 'Treino A', foco: 'Peito, Ombro e Tríceps', tempoEstimado: '45-60',
  exercicios: [
    { id: 1, nome: 'Supino Reto com Barra', series: 4, repsAlvo: '8-10', pesoBaseAtual: 20, taxaAumentoKg: 5, concluido: false, seriesRealizadas: [] as any[] },
    { id: 2, nome: 'Desenvolvimento Militar', series: 3, repsAlvo: '10-12', pesoBaseAtual: 10, taxaAumentoKg: 2, concluido: false, seriesRealizadas: [] as any[] },
    { id: 3, nome: 'Elevação Lateral', series: 4, repsAlvo: '12-15', pesoBaseAtual: 8, taxaAumentoKg: 0, concluido: false, seriesRealizadas: [] as any[] }
  ]
}

const mockTreinoB = {
  id: 2, nome: 'Treino B', foco: 'Costas e Bíceps', tempoEstimado: '50-65',
  exercicios: [
    { id: 4, nome: 'Puxada Frontal', series: 4, repsAlvo: '10-12', pesoBaseAtual: 35, taxaAumentoKg: 5, concluido: false, seriesRealizadas: [] as any[] },
    { id: 5, nome: 'Remada Curvada', series: 4, repsAlvo: '8-10', pesoBaseAtual: 20, taxaAumentoKg: 5, concluido: false, seriesRealizadas: [] as any[] },
    { id: 6, nome: 'Rosca Direta', series: 3, repsAlvo: '10-12', pesoBaseAtual: 10, taxaAumentoKg: 2, concluido: false, seriesRealizadas: [] as any[] }
  ]
}

const treinoHoje = ref(mockTreinoA)
const proximoTreinoNome = ref('Treino B - Costas e Bíceps') 
const trocarTreino = () => {
  treinoHoje.value = treinoHoje.value.id === 1 ? mockTreinoB : mockTreinoA
}

const iniciarTreino = () => {
  isTreinoAtivo.value = true
  treinoHoje.value.exercicios.forEach(ex => {
    ex.seriesRealizadas = Array.from({ length: ex.series }).map((_, index) => ({
      numero: index + 1,
      pesoFito: ex.pesoBaseAtual + (index * ex.taxaAumentoKg),
      repsFeitas: ex.repsAlvo.split('-')[0], 
      finalizada: false
    }))
  })
}

const alternarSanfona = (id: number) => {
  exercicioExpandido.value = exercicioExpandido.value === id ? null : id
}

const autoExpandirProximo = (atualId: number) => {
  const indexAtual = treinoHoje.value.exercicios.findIndex(e => e.id === atualId)
  const proximo = treinoHoje.value.exercicios[indexAtual + 1]
  if (proximo && !proximo.concluido) {
    exercicioExpandido.value = proximo.id
  } else {
    exercicioExpandido.value = null
  }
}

const concluirSerie = (exercicioId: number, serieIndex: number) => {
  const ex = treinoHoje.value.exercicios.find(e => e.id === exercicioId)
  if (ex) {
    ex.seriesRealizadas[serieIndex].finalizada = !ex.seriesRealizadas[serieIndex].finalizada
    const todasFinalizadas = ex.seriesRealizadas.every(s => s.finalizada)
    ex.concluido = todasFinalizadas
    if (todasFinalizadas) setTimeout(() => autoExpandirProximo(exercicioId), 400)
  }
}

const concluirTodasSeries = (exercicioId: number) => {
  const ex = treinoHoje.value.exercicios.find(e => e.id === exercicioId)
  if (ex) {
    ex.seriesRealizadas.forEach(s => s.finalizada = true)
    ex.concluido = true
    setTimeout(() => autoExpandirProximo(exercicioId), 400)
  }
}

const resetarExercicio = (exercicioId: number) => {
  const ex = treinoHoje.value.exercicios.find(e => e.id === exercicioId)
  if (ex) {
    ex.seriesRealizadas.forEach(s => s.finalizada = false)
    ex.concluido = false
  }
}

const finalizarTreino = () => {
  isTreinoAtivo.value = false
  treinoFinalizadoHoje.value = true
}

const progressoTreino = computed(() => {
  const total = treinoHoje.value.exercicios.length
  const concluidos = treinoHoje.value.exercicios.filter(e => e.concluido).length
  return { concluidos, total, porcentagem: Math.round((concluidos / total) * 100) }
})
</script>

<template>
  <div class="flex flex-col gap-6 pb-8 animate-in fade-in duration-500">
    <div v-if="treinoFinalizadoHoje" class="flex flex-col items-center justify-center pt-10 px-4 animate-in zoom-in-95 duration-500">
      <div class="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/30 mb-6 border-4 border-teal-50">
        <Trophy :size="48" class="text-white" />
      </div>
      <h2 class="text-3xl font-black text-whitesmoke-950 text-center">Treino Concluído!</h2>
      <p class="text-whitesmoke-500 text-center mt-2 font-medium">Você esmagou o {{ treinoHoje.nome }} hoje. Bom descanso!</p>
      
      <div class="bg-white w-full rounded-[2rem] p-6 shadow-sm border border-whitesmoke-200 mt-8 flex flex-col items-center">
        <span class="text-[10px] font-bold uppercase tracking-widest text-whitesmoke-400 mb-1">Próximo Desafio (Amanhã)</span>
        <h3 class="text-lg font-black text-amethyst-600 text-center">{{ proximoTreinoNome }}</h3>
      </div>
    </div>

    <div v-else-if="!isTreinoAtivo" class="flex flex-col gap-6">
      
      <div class="px-2 mt-2">
        <h2 class="text-2xl font-black text-whitesmoke-950">Pronto para suar?</h2>
        <p class="text-sm text-whitesmoke-500 mt-1">Este é o seu planejamento para hoje.</p>
      </div>

      <div class="bg-amethyst-500 rounded-[2rem] p-1 shadow-lg shadow-amethyst-500/20 relative overflow-hidden">
        <div class="absolute -right-6 -top-6 text-white/10 rotate-12 pointer-events-none">
          <Dumbbell :size="120" stroke-width="1.5" />
        </div>
        
        <div class="bg-amethyst-600/20 rounded-[1.8rem] p-5 backdrop-blur-sm border border-white/10 relative z-10 flex flex-col gap-5">
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-md">
                Ficha Principal
              </span>
              <button @click="trocarTreino" class="flex items-center gap-1 text-[10px] font-bold text-white bg-black/20 hover:bg-black/30 px-2.5 py-1 rounded-full transition-colors backdrop-blur-md">
                <ArrowRightLeft :size="12" />
                TROCAR
              </button>
            </div>
            <h3 class="text-3xl font-black text-white mt-2">{{ treinoHoje.nome }}</h3>
            <p class="text-amethyst-100 font-medium mt-1">{{ treinoHoje.foco }}</p>
          </div>
          
          <div class="flex items-center gap-4 bg-black/10 rounded-2xl p-3 border border-white/5">
            <div class="flex items-center gap-2 text-white">
              <Clock :size="18" class="text-amethyst-200" />
              <span class="text-sm font-bold">{{ treinoHoje.tempoEstimado }} <span class="font-normal text-amethyst-200 text-xs">min</span></span>
            </div>
            <div class="w-px h-6 bg-white/10"></div>
            <div class="flex items-center gap-2 text-white">
              <Flame :size="18" class="text-amethyst-200" />
              <span class="text-sm font-bold">{{ treinoHoje.exercicios.length }} <span class="font-normal text-amethyst-200 text-xs">ex</span></span>
            </div>
          </div>
          
          <button 
            @click="iniciarTreino"
            class="w-full bg-white text-amethyst-600 hover:bg-whitesmoke-50 font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] group mt-2"
          >
            <Play :size="22" class="fill-amethyst-600 group-hover:scale-110 transition-transform" />
            INICIAR TREINO
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <h3 class="text-lg font-bold text-whitesmoke-950 px-2">Visão Geral</h3>
        <div class="bg-white rounded-3xl p-2 shadow-sm border border-whitesmoke-200 flex flex-col">
          <div 
            v-for="(exercicio, index) in treinoHoje.exercicios" 
            :key="exercicio.id"
            class="flex items-center gap-4 p-3 rounded-2xl transition-colors hover:bg-whitesmoke-50"
            :class="{ 'border-b border-whitesmoke-100 rounded-none': index !== treinoHoje.exercicios.length - 1 }"
          >
            <div class="w-10 h-10 rounded-full bg-amethyst-50 text-amethyst-500 font-black flex items-center justify-center shrink-0">
              {{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-bold text-whitesmoke-950 truncate">{{ exercicio.nome }}</h4>
              <p class="text-xs font-medium text-whitesmoke-400 mt-0.5">
                {{ exercicio.series }} séries de {{ exercicio.repsAlvo }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500 pb-20">
      <div class="flex items-center justify-between px-2 mb-2 sticky top-0 z-30 bg-whitesmoke-50/90 backdrop-blur-md py-2 -mx-2 px-4 rounded-b-2xl shadow-sm">
        <div class="flex flex-col">
          <h2 class="text-xl font-black text-whitesmoke-950">{{ treinoHoje.nome }}</h2>
          <div class="flex items-center gap-2 mt-1.5">
            <div class="w-24 h-1.5 bg-whitesmoke-200 rounded-full overflow-hidden">
              <div class="h-full bg-teal-500 transition-all duration-500" :style="{ width: progressoTreino.porcentagem + '%' }"></div>
            </div>
            <span class="text-[10px] font-bold text-whitesmoke-500">{{ progressoTreino.concluidos }}/{{ progressoTreino.total }}</span>
          </div>
        </div>
        <div class="bg-white px-3 py-1.5 rounded-xl shadow-sm border border-whitesmoke-200 flex items-center gap-1.5">
          <Clock :size="14" class="text-whitesmoke-500" />
          <span class="font-mono font-bold text-whitesmoke-950 text-sm">{{ cronometro }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <div 
          v-for="(exercicio, index) in treinoHoje.exercicios" 
          :key="exercicio.id"
          class="bg-white rounded-[1.5rem] shadow-sm border transition-all duration-500 overflow-hidden"
          :class="[
            exercicioExpandido === exercicio.id ? 'border-amethyst-400 shadow-md ring-4 ring-amethyst-50' : 'border-whitesmoke-200',
            exercicio.concluido && exercicioExpandido !== exercicio.id ? 'opacity-60 bg-whitesmoke-50' : ''
          ]"
        >
          <div @click="alternarSanfona(exercicio.id)" class="flex items-center gap-4 p-4 cursor-pointer select-none">
            <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors"
              :class="[exercicio.concluido ? 'bg-teal-500 text-white' : exercicioExpandido === exercicio.id ? 'bg-amethyst-500 text-white' : 'bg-amethyst-50 text-amethyst-500']">
              <CheckCircle2 v-if="exercicio.concluido" :size="24" />
              <span v-else class="font-black text-lg">{{ index + 1 }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-base font-bold text-whitesmoke-950 truncate" :class="{'line-through text-whitesmoke-400': exercicio.concluido}">{{ exercicio.nome }}</h4>
              <p class="text-xs font-medium text-whitesmoke-400 mt-0.5">{{ exercicio.series }}x {{ exercicio.repsAlvo }} reps</p>
            </div>
            <ChevronDown :size="20" class="text-whitesmoke-400 transition-transform duration-300" :class="{'rotate-180 text-amethyst-500': exercicioExpandido === exercicio.id}" />
          </div>

          <div class="grid transition-all duration-500 ease-in-out" :class="exercicioExpandido === exercicio.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'">
            <div class="overflow-hidden">
              <div class="p-4 pt-0 border-t border-whitesmoke-100 mt-2">
                
                <div class="flex items-center gap-2 mb-4 mt-3">
                  <button class="flex-1 bg-whitesmoke-100 hover:bg-whitesmoke-200 text-whitesmoke-700 text-[10px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-colors">
                    <RefreshCw :size="12" /> SUBSTITUIR
                  </button>
                  <button class="flex-1 bg-amethyst-50 hover:bg-amethyst-100 text-amethyst-600 text-[10px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-colors">
                    <LineChart :size="12" /> EVOLUÇÃO
                  </button>
                </div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center px-2 text-[10px] font-bold text-whitesmoke-400 uppercase tracking-widest gap-4">
                    <span class="w-8 text-center">Série</span>
                    <span class="w-14 text-center">Peso</span>
                    <span class="w-14 text-center">Reps</span>
                  </div>
                  
                  <div class="flex items-center gap-1">
                    <button v-if="exercicio.concluido" @click="resetarExercicio(exercicio.id)" class="text-[9px] font-bold text-red-400 bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-red-100 transition-colors">
                      <RotateCcw :size="10" /> DESFAZER
                    </button>
                    <button v-else @click="concluirTodasSeries(exercicio.id)" class="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-teal-100 transition-colors">
                      <CheckCheck :size="10" /> CHECK ALL
                    </button>
                  </div>
                </div>

                <!-- Linhas das Séries -->
                <div class="flex flex-col gap-2">
                  <div v-for="(serie, sIndex) in exercicio.seriesRealizadas" :key="sIndex" class="flex items-center p-2 rounded-2xl transition-colors duration-300" :class="serie.finalizada ? 'bg-teal-50/50 border border-teal-100/50' : 'bg-white border border-whitesmoke-200'">
                    <div class="w-8 text-center font-black text-whitesmoke-400" :class="{'text-teal-600': serie.finalizada}">{{ serie.numero }}</div>
                    <div class="flex-1 flex justify-center">
                      <input type="number" v-model="serie.pesoFito" :disabled="serie.finalizada" class="w-16 bg-whitesmoke-100 text-center font-bold text-whitesmoke-950 py-2 rounded-xl border border-transparent focus:bg-white focus:border-amethyst-500 outline-none transition-all disabled:opacity-50" />
                    </div>
                    <div class="flex-1 flex justify-center">
                      <input type="number" v-model="serie.repsFeitas" :disabled="serie.finalizada" class="w-16 bg-whitesmoke-100 text-center font-bold text-whitesmoke-950 py-2 rounded-xl border border-transparent focus:bg-white focus:border-amethyst-500 outline-none transition-all disabled:opacity-50" />
                    </div>
                    <div class="w-12 flex justify-center">
                      <button @click="concluirSerie(exercicio.id, sIndex)" class="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95" :class="serie.finalizada ? 'bg-teal-500 text-white shadow-teal-500/30' : 'bg-whitesmoke-200 text-whitesmoke-400 hover:bg-whitesmoke-300'">
                        <Check v-if="serie.finalizada" :size="20" stroke-width="3" />
                        <span v-else class="w-3 h-3 rounded-full bg-whitesmoke-400/50"></span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <button 
        @click="finalizarTreino"
        class="w-full bg-whitesmoke-950 hover:bg-black text-white font-black text-sm py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] mt-4"
      >
        FINALIZAR TREINO HOJE
      </button>

    </div>
  </div>
</template>