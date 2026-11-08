<script setup lang="ts">
import ModalSheetHeader from '@/components/layout/ModalSheetHeader.vue'
import { modalSheetBackdrop, modalSheetPanel } from '@/components/layout/modalSheetStyles'
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTreinoStore } from '@/stores/treinoStore'
import { CheckCircle2, ChevronDown, CheckCheck, RotateCcw, Check, Play, WifiOff, Timer } from 'lucide-vue-next'

const store = useTreinoStore()
const {
  treinoHoje, exerciciosExecucao, exercicioExpandido,
  progressoTreino, modalVideoAberto, videoUrlAtivo, videoTituloAtivo,
  estadoPersistencia, erroPersistencia
} = storeToRefs(store)

const temConexao = ref(navigator.onLine)
const atualizarStatusConexao = () => { temConexao.value = navigator.onLine }

onMounted(() => {
  window.addEventListener('online', atualizarStatusConexao)
  window.addEventListener('offline', atualizarStatusConexao)
})

onUnmounted(() => {
  window.removeEventListener('online', atualizarStatusConexao)
  window.removeEventListener('offline', atualizarStatusConexao)
})
</script>

<template>
  <div class="flex flex-col gap-4 animate-in slide-in-from-right-4 pb-20 relative">

    <div class="mb-2 flex flex-col gap-3 px-2 pt-8 pb-3">
      <p class="break-words text-xl font-black text-amethyst-500">{{ treinoHoje?.nome || 'Treino em andamento' }}</p>
      <div class="flex items-center gap-3">
        <div class="flex-1 h-1.5 bg-whitesmoke-200 rounded-full overflow-hidden">
          <div class="h-full bg-amethyst-500 transition-all duration-500" :style="{ width: progressoTreino.porcentagem + '%' }"></div>
        </div>
        <span class="text-[10px] font-bold text-whitesmoke-500 shrink-0">{{ progressoTreino.concluidos }}/{{ progressoTreino.total }} concluídos</span>
      </div>
      <div v-if="estadoPersistencia === 'erro'" role="alert" class="flex items-center justify-between gap-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
        <span>{{ erroPersistencia }}</span>
        <button type="button" @click="store.tentarSalvarNovamente" class="shrink-0 rounded-lg bg-white px-3 py-2 font-bold text-red-700 shadow-sm">
          Tentar novamente
        </button>
      </div>
      <p v-else aria-live="polite" class="text-[10px] font-medium text-whitesmoke-400">
        {{ estadoPersistencia === 'salvando' ? 'Salvando alterações…' : 'Sessão salva automaticamente' }}
      </p>
    </div>

    <!-- Camada sob o painel de foco; o z-10 mantém o desfoque abaixo dele. -->
    <div class="flex flex-col gap-3 relative z-10">
      <div
        v-for="(ex, index) in exerciciosExecucao" :key="ex.idUnico"
        class="bg-white rounded-[1.5rem] shadow-sm border transition-all duration-500 overflow-hidden"
        :class="[
          exercicioExpandido === ex.idUnico ? 'border-amethyst-200 shadow-sm' : 'border-whitesmoke-200',
          ex.concluido && exercicioExpandido !== ex.idUnico ? 'opacity-60 bg-whitesmoke-50' : ''
        ]"
      >
        <div @click="exercicioExpandido = exercicioExpandido === ex.idUnico ? null : ex.idUnico" class="flex items-center gap-4 p-4 cursor-pointer select-none">
          <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors"
            :class="[ex.concluido ? 'bg-teal-500 text-white' : exercicioExpandido === ex.idUnico ? 'bg-amethyst-100 text-amethyst-600' : 'bg-amethyst-50 text-amethyst-500']">
            <CheckCircle2 v-if="ex.concluido" :size="24" />
            <span v-else class="font-black text-lg">{{ index + 1 }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-base font-bold text-whitesmoke-950 truncate" :class="{'line-through text-whitesmoke-400': ex.concluido}">{{ ex.nome }}</h4>
            <p class="text-xs font-medium text-whitesmoke-400 mt-0.5">{{ ex.seriesTotais }}x {{ ex.repsAlvo }} reps</p>
          </div>
          <ChevronDown :size="20" class="text-whitesmoke-400 transition-transform duration-300" :class="{'rotate-180': exercicioExpandido === ex.idUnico}" />
        </div>

        <div class="grid transition-all duration-500 ease-in-out" :class="exercicioExpandido === ex.idUnico ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'">
          <div class="overflow-hidden">
            <div class="p-4 pt-0 border-t border-whitesmoke-100 mt-2 flex flex-col gap-4">

              <div @click.stop="store.abrirVideo(ex.nome, ex.videoUrl)" class="mt-3 relative w-full h-20 rounded-2xl overflow-hidden bg-whitesmoke-100 border border-whitesmoke-200 cursor-pointer group shadow-sm flex items-center justify-between px-4 hover:border-whitesmoke-300 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-white shadow-sm border border-whitesmoke-200 flex items-center justify-center text-whitesmoke-700 group-hover:scale-105 transition-transform">
                    <Play :size="16" class="fill-whitesmoke-950 ml-0.5" />
                  </div>
                  <div>
                    <span class="block text-[10px] font-bold text-whitesmoke-400 uppercase tracking-widest">Demonstração</span>
                    <h5 class="text-xs font-bold text-whitesmoke-950">Como executar o exercício</h5>
                  </div>
                </div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-cerulean-600 bg-cerulean-50 px-2.5 py-1 rounded-lg border border-cerulean-100">Ver Vídeo</span>
              </div>

              <div>
                <div class="mb-3 flex justify-end">
                  <div class="flex items-center gap-1">
                    <button v-if="ex.concluido" @click="store.resetarExercicio(ex.idUnico)" class="text-[9px] font-bold text-red-400 bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-red-100">
                      <RotateCcw :size="10" /> DESFAZER
                    </button>
                    <button v-else @click="store.concluirTodasSeries(ex.idUnico)" class="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-teal-100">
                      <CheckCheck :size="10" /> CHECK ALL
                    </button>
                  </div>
                </div>

                <div class="mb-2 grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_3rem] items-center gap-2 border border-transparent px-2 text-center text-[10px] font-bold uppercase tracking-widest text-whitesmoke-400">
                  <span>Série</span>
                  <span>Peso</span>
                  <span>Reps</span>
                  <span class="sr-only">Concluir série</span>
                </div>

                <div class="flex flex-col gap-2">
                  <div v-for="(serie, sIndex) in ex.seriesRealizadas" :key="sIndex" class="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_3rem] items-center gap-2 p-2 rounded-2xl transition-colors duration-300" :class="serie.finalizada ? 'bg-teal-50/50 border border-teal-100/50' : 'bg-white border border-whitesmoke-200'">
                    <div class="w-8 text-center font-black text-whitesmoke-400" :class="{'text-teal-600': serie.finalizada}">{{ serie.numero }}</div>

                    <div class="flex min-w-0 justify-center">
                      <input type="number" :aria-label="`Peso da série ${serie.numero} de ${ex.nome}`" v-model.number="serie.pesoFito" @input="store.atualizarPesoSequencial(ex.idUnico, sIndex)" :disabled="serie.finalizada" class="w-full min-w-0 max-w-16 bg-whitesmoke-100 text-center font-semibold text-whitesmoke-950 py-2 rounded-xl border border-transparent outline-none disabled:opacity-50" />
                    </div>

                    <div class="flex min-w-0 justify-center">
                      <input type="text" :aria-label="`Repetições da série ${serie.numero} de ${ex.nome}`" v-model="serie.repsFeitas" :disabled="serie.finalizada" class="w-full min-w-0 max-w-16 bg-whitesmoke-100 text-center font-semibold text-whitesmoke-950 py-2 rounded-xl border border-transparent outline-none disabled:opacity-50" />
                    </div>

                    <div class="w-12 flex justify-center">
                      <button @click="store.concluirSerie(ex.idUnico, sIndex)" class="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95" :class="serie.finalizada ? 'bg-teal-500 text-white shadow-teal-500/30' : 'bg-whitesmoke-200 text-whitesmoke-400'">
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
    </div>

    <button
      :aria-busy="store.finalizando" @click="store.finalizarTreino"
      :disabled="store.finalizando || progressoTreino.concluidos < progressoTreino.total"
      class="relative z-10 mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amethyst-500 py-4 text-sm font-black text-white transition-all hover:bg-amethyst-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-40"
    >
      {{ progressoTreino.concluidos < progressoTreino.total ? `CONCLUA TODOS OS EXERCÍCIOS (${progressoTreino.concluidos}/${progressoTreino.total})` : 'FINALIZAR TREINO HOJE' }}
    </button>


    <!-- z-40 mantém o painel e o desfoque abaixo da TopBar (z-100). -->
    <transition
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="store.descansoRodando || store.descansoZerado" class="fixed inset-0 z-40 flex flex-col items-center justify-center bg-white/40 backdrop-blur-xl px-6">

        <div
          class="bg-white w-full max-w-xs rounded-[2.5rem] p-8 flex flex-col items-center text-center transition-all duration-500 border animate-in zoom-in-95 duration-500"
          :class="store.descansoZerado ? 'shadow-emerald-500/20 border-emerald-100' : 'shadow-[0_20px_40px_rgba(0,0,0,0.08)] border-whitesmoke-100'"
        >
          <div class="w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors duration-500" :class="store.descansoZerado ? 'bg-emerald-50 text-emerald-500' : `bg-${treinoHoje?.corTema}-50 text-${treinoHoje?.corTema}-500`">
             <Timer v-if="store.descansoRodando" :size="40" class="animate-pulse" />
             <CheckCircle2 v-else :size="44" stroke-width="2.5" />
          </div>

          <span class="text-[10px] font-bold uppercase tracking-widest mb-1 transition-colors" :class="store.descansoZerado ? 'text-emerald-500' : 'text-whitesmoke-400'">
            {{ store.descansoRodando ? 'Recuperação' : 'Acabou o tempo!' }}
          </span>

          <div class="text-7xl font-black font-mono tracking-tighter leading-none mb-8 transition-colors" :class="store.descansoZerado ? 'text-emerald-500' : 'text-whitesmoke-950'">
            {{ store.descansoRodando
                ? Math.floor(store.descansoTempoRestante / 60).toString().padStart(2, '0') + ':' + (store.descansoTempoRestante % 60).toString().padStart(2, '0')
                : '00:00' }}
          </div>

          <button @click="store.pularDescanso" class="w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95" :class="store.descansoZerado ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-whitesmoke-100 hover:bg-whitesmoke-200 text-whitesmoke-500'">
            {{ store.descansoZerado ? 'BORA VOLTAR!' : 'PULAR DESCANSO' }}
          </button>
        </div>

      </div>
    </transition>


    <!-- O modal de vídeo usa z-60 para ficar acima da execução e dos diálogos locais. -->
    <Transition name="gy-modal" :duration="{ enter: 420, leave: 280 }" appear><div v-if="modalVideoAberto" :class="modalSheetBackdrop" @click="modalVideoAberto = false"></div></Transition>

    <Transition name="gy-sheet" appear><div v-if="modalVideoAberto" role="dialog" aria-modal="true" aria-labelledby="video-treino-titulo" :class="modalSheetPanel">
      <ModalSheetHeader :titulo="videoTituloAtivo" etiqueta="Demonstração" cor-classe="bg-amethyst-500" titulo-id="video-treino-titulo" @fechar="modalVideoAberto = false" />
      <div class="p-6 flex flex-col items-center justify-center bg-black min-h-[300px]">
        <iframe v-if="temConexao" :src="videoUrlAtivo" class="w-full aspect-video rounded-2xl shadow-lg border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        <div v-else class="flex flex-col items-center justify-center text-center p-6 text-white gap-3">
          <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-red-400"><WifiOff :size="32" /></div>
          <h4 class="font-bold text-lg">Você está offline</h4>
          <p class="text-xs text-white/60 max-w-xs">Não foi possível carregar o vídeo do YouTube porque o dispositivo não possui conexão com a internet.</p>
        </div>
      </div>
    </div></Transition>

  </div>
</template>
