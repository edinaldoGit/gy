<script setup lang="ts">
import ModalSheetHeader from '@/components/layout/ModalSheetHeader.vue'
import { modalSheetBackdrop, modalSheetPanel } from '@/components/layout/modalSheetStyles'
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useFinalizarTreino } from '@/composables/useFinalizarTreino'
import { useTreinoStore } from '@/stores/treinoStore'
import { CheckCircle2, ChevronDown, CheckCheck, RotateCcw, Check, Play, WifiOff, Timer, MoreHorizontal } from 'lucide-vue-next'
import { ArrowLeftRight } from 'lucide-vue-next'
import { confirmation } from '@/composables/useConfirm'
import SubstituirExercicio from './SubstituirExercicio.vue'
import { temRegistros, type ExercicioExecucao } from '@/utils/exercicioSessao'

const finalizarTreino = useFinalizarTreino()
const store = useTreinoStore()
const {
  treinoHoje, exerciciosExecucao, exercicioExpandido,
  progressoTreino, modalVideoAberto, videoUrlAtivo, videoTituloAtivo,
  estadoPersistencia, erroPersistencia
} = storeToRefs(store)

const temConexao = ref(navigator.onLine)
const slotSubstituicao = ref<string | null>(null)
const anterior = (ex: ExercicioExecucao) => ex.exercicioCanonicoId ? store.ultimasExecucoes.get(ex.exercicioCanonicoId) : null
const dataAnterior = (data: Date) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(data)
const atualizarStatusConexao = () => { temConexao.value = navigator.onLine }

onMounted(() => {
  window.addEventListener('online', atualizarStatusConexao)
  window.addEventListener('offline', atualizarStatusConexao)
})

onUnmounted(() => {
  window.removeEventListener('online', atualizarStatusConexao)
  window.removeEventListener('offline', atualizarStatusConexao)
})

const confirmarCancelamento = () => {
  void confirmation.ask({
    title: 'Cancelar treino em andamento?',
    message: 'Esta sessão será cancelada e não contará como treino concluído.',
    details: 'As sessões concluídas anteriormente e a ficha serão mantidas.',
    variant: 'error', icon: 'warning', cancelText: 'Continuar treinando', confirmText: 'Cancelar treino',
    action: store.cancelarTreino
  })
}
</script>

<template>
  <div class="flex flex-col gap-4 animate-in slide-in-from-right-4 pb-20 relative">

    <div class="mb-2 flex flex-col gap-3 px-2 pt-8 pb-3">
      <div class="flex items-start justify-between gap-2">
        <p class="min-w-0 break-words text-xl font-black text-amethyst-500">{{ treinoHoje?.nome || 'Treino em andamento' }}</p>
        <details class="group relative shrink-0">
          <summary aria-label="Opções da sessão" class="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-whitesmoke-200 bg-white text-whitesmoke-500 transition hover:bg-whitesmoke-50 focus-visible:outline-2 focus-visible:outline-amethyst-500 [&::-webkit-details-marker]:hidden">
            <MoreHorizontal :size="20" />
          </summary>
          <div class="absolute right-0 top-full z-20 mt-2 w-52 rounded-2xl border border-whitesmoke-200 bg-white p-1.5 shadow-lg">
            <button type="button" :disabled="store.cancelando || store.finalizando" class="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-bold text-bubblegum-700 transition hover:bg-bubblegum-50 focus-visible:outline-2 focus-visible:outline-bubblegum-600 disabled:opacity-50" @click="confirmarCancelamento">
              Cancelar treino
            </button>
          </div>
        </details>
      </div>
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
      <div v-if="store.erroHistorico" role="alert" class="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{{ store.erroHistorico }} <button type="button" class="font-bold underline" @click="store.carregarReferencias">Tentar novamente</button></div>
    </div>

    <!-- Camada sob o painel de foco; o z-10 mantém o desfoque abaixo dele. -->
    <div class="flex flex-col gap-3 relative z-10" :inert="!!slotSubstituicao || store.substituindo">
      <div
        v-for="(ex, index) in exerciciosExecucao" :key="ex.idUnico"
        class="bg-white rounded-[1.5rem] shadow-sm border transition-all duration-500 overflow-hidden"
        :class="[
          exercicioExpandido === ex.idUnico ? 'border-amethyst-200 shadow-sm' : 'border-whitesmoke-200',
          ex.concluido && exercicioExpandido !== ex.idUnico ? 'opacity-60 bg-whitesmoke-50' : ''
        ]"
      >
        <button type="button" :aria-expanded="exercicioExpandido === ex.idUnico" @click="exercicioExpandido = exercicioExpandido === ex.idUnico ? null : ex.idUnico" class="flex w-full items-center gap-3 p-3.5 text-left select-none focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-amethyst-500">
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors"
            :class="[ex.concluido ? 'bg-teal-500 text-white' : exercicioExpandido === ex.idUnico ? 'bg-amethyst-100 text-amethyst-600' : 'bg-amethyst-50 text-amethyst-500']">
            <CheckCircle2 v-if="ex.concluido" :size="24" />
            <span v-else class="font-black text-lg">{{ index + 1 }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-bold text-whitesmoke-950 leading-snug break-words sm:text-base" :class="{'line-through text-whitesmoke-400': ex.concluido}">{{ ex.nome }}</h4>
            <p class="text-xs font-medium text-whitesmoke-400 mt-0.5">{{ ex.seriesTotais }}x {{ ex.repsAlvo }} reps</p>
            <p v-if="ex.planejado && ex.planejado.exercicioId !== ex.exercicioId" class="mt-1 break-words text-[11px] font-medium text-amethyst-600">Substituindo: {{ ex.planejado.nome }}</p>
          </div>
          <ChevronDown :size="18" class="shrink-0 text-whitesmoke-400 transition-transform duration-300" :class="{'rotate-180': exercicioExpandido === ex.idUnico}" />
        </button>

        <div :inert="exercicioExpandido !== ex.idUnico" class="grid transition-all duration-500 ease-in-out" :class="exercicioExpandido === ex.idUnico ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'">
          <div class="overflow-hidden">
            <div class="px-3 pb-3 border-t border-whitesmoke-100 flex flex-col gap-3 sm:px-4 sm:pb-4">

              <div class="flex flex-wrap items-center gap-2 pt-3">
                <button type="button" class="group inline-flex min-h-11 flex-1 items-center gap-2.5 rounded-xl border border-amethyst-100 bg-amethyst-50/60 px-3 text-left text-amethyst-700 transition hover:border-amethyst-200 hover:bg-amethyst-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amethyst-500" @click="store.abrirVideo(ex.nome, ex.videoUrl)">
                  <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amethyst-500 text-white"><Play :size="13" class="ml-0.5 fill-current" /></span>
                  <span class="flex-1 text-xs font-bold">Ver execução</span>
                  <span class="text-[9px] font-bold uppercase tracking-wide text-amethyst-500">Vídeo</span>
                </button>
                <button type="button" :disabled="temRegistros(ex)" :title="temRegistros(ex) ? 'A substituição fica bloqueada após editar ou registrar séries.' : 'Substituir exercício'" class="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-whitesmoke-200 px-3 text-xs font-bold text-whitesmoke-600 transition hover:bg-whitesmoke-50 focus-visible:outline-2 focus-visible:outline-amethyst-500 disabled:opacity-40" @click="slotSubstituicao = ex.idUnico"><ArrowLeftRight :size="15" />Trocar</button>
                <button v-if="ex.planejado && ex.planejado.exercicioId !== ex.exercicioId" type="button" :disabled="temRegistros(ex)" class="min-h-11 rounded-xl px-2 text-xs font-bold text-amethyst-600 disabled:opacity-40" @click="store.substituirExercicio(ex.idUnico)">Voltar ao original</button>
              </div>

              <div>
                <div class="mb-2 flex justify-end">
                  <div class="flex items-center gap-1">
                    <button v-if="ex.concluido" @click="store.resetarExercicio(ex.idUnico)" class="min-h-8 text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 hover:bg-red-100">
                      <RotateCcw :size="10" /> Desfazer
                    </button>
                    <button v-else @click="store.concluirTodasSeries(ex.idUnico)" class="min-h-8 text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 hover:bg-teal-100">
                      <CheckCheck :size="10" /> Concluir todas
                    </button>
                  </div>
                </div>

                <div class="mb-2 grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_3rem] items-center gap-2 border border-transparent px-2 text-center text-[10px] font-bold uppercase tracking-widest text-whitesmoke-400">
                  <span>Série</span>
                  <span>Peso · kg</span>
                  <span>Reps</span>
                  <span class="sr-only">Concluir série</span>
                </div>

                <div class="flex flex-col gap-1.5">
                  <div v-for="(serie, sIndex) in ex.seriesRealizadas" :key="sIndex" class="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_3rem] items-center gap-2 px-2 py-1.5 rounded-xl transition-colors duration-300" :class="serie.finalizada ? 'bg-teal-50/50 border border-teal-100/50' : 'bg-white border border-whitesmoke-200'">
                    <div class="w-8 text-center font-black text-whitesmoke-400" :class="{'text-teal-600': serie.finalizada}">{{ serie.numero }}</div>

                    <div class="flex min-w-0 justify-center">
                      <input type="number" :aria-label="`Peso da série ${serie.numero} de ${ex.nome}`" v-model.number="serie.pesoFito" @input="store.atualizarPesoSequencial(ex.idUnico, sIndex)" :disabled="serie.finalizada" class="w-full min-w-0 max-w-16 bg-whitesmoke-100 text-center font-semibold text-whitesmoke-950 py-2 rounded-xl border border-transparent outline-none disabled:opacity-50" />
                    </div>

                    <div class="flex min-w-0 justify-center">
                      <input type="text" :aria-label="`Repetições da série ${serie.numero} de ${ex.nome}`" v-model="serie.repsFeitas" @input="store.marcarEdicao(ex.idUnico)" :disabled="serie.finalizada" class="w-full min-w-0 max-w-16 bg-whitesmoke-100 text-center font-semibold text-whitesmoke-950 py-2 rounded-xl border border-transparent outline-none disabled:opacity-50" />
                    </div>

                    <div class="w-12 flex justify-center">
                      <button type="button" :aria-label="`${serie.finalizada ? 'Desfazer' : 'Concluir'} série ${serie.numero} de ${ex.nome}`" @click="store.concluirSerie(ex.idUnico, sIndex)" class="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95" :class="serie.finalizada ? 'bg-teal-500 text-white shadow-teal-500/30' : 'bg-whitesmoke-200 text-whitesmoke-400'">
                        <Check v-if="serie.finalizada" :size="20" stroke-width="3" />
                        <span v-else class="w-3 h-3 rounded-full bg-whitesmoke-400/50"></span>
                      </button>
                    </div>
                  </div>
                </div>
                <label class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-whitesmoke-50 px-3 py-2 text-xs font-semibold text-whitesmoke-500">Descanso entre séries · segundos<input v-model.number="ex.descansoSegundos" type="number" min="0" max="3600" :aria-label="`Descanso de ${ex.nome} em segundos`" class="min-h-10 w-20 rounded-xl bg-whitesmoke-100 px-3 text-center text-whitesmoke-800" /></label>
              </div>

              <details class="group rounded-xl border border-amethyst-100 bg-amethyst-50/40">
                <summary class="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-bold text-amethyst-700 focus-visible:outline-2 focus-visible:outline-amethyst-500 [&::-webkit-details-marker]:hidden">
                  <RotateCcw :size="14" class="shrink-0" />
                  <span class="flex-1">Última execução <span v-if="anterior(ex)" class="ml-1 font-medium text-whitesmoke-500">· {{ dataAnterior(anterior(ex)!.data) }}</span></span>
                  <ChevronDown :size="15" class="shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div class="border-t border-amethyst-100 px-3 pb-3 pt-2">
                  <p v-if="store.historicoCarregando" class="text-xs text-whitesmoke-500">Consultando histórico…</p>
                  <template v-else-if="anterior(ex)">
                    <p class="break-words text-[11px] text-whitesmoke-500">{{ anterior(ex)!.treinoNome }} · {{ anterior(ex)!.fichaNome }}</p>
                    <dl class="mt-2 flex flex-wrap gap-1.5 text-xs">
                      <div v-for="serie in anterior(ex)!.series" :key="serie.numeroDaSerie" class="rounded-lg border border-amethyst-100 bg-white px-2 py-1.5"><dt class="text-[10px] font-medium text-whitesmoke-500">Série {{ serie.numeroDaSerie }}</dt><dd class="font-bold text-whitesmoke-800">{{ serie.peso }} kg · {{ serie.reps }} reps</dd></div>
                    </dl>
                    <button type="button" :disabled="temRegistros(ex)" class="mt-2 min-h-10 rounded-lg bg-white px-3 text-xs font-bold text-amethyst-600 disabled:opacity-40" @click="store.usarUltimasCargas(ex.idUnico)">Usar cargas e repetições anteriores</button>
                    <p class="mt-1 text-[10px] text-whitesmoke-500">Referência apenas. Confirme cada série ao concluir.</p>
                  </template>
                  <p v-else class="text-xs text-whitesmoke-500">{{ store.erroHistorico || 'Ainda não há séries concluídas para este exercício.' }}</p>
                </div>
              </details>

            </div>
          </div>
        </div>
      </div>
    </div>

    <button
      :aria-busy="store.finalizando" @click="finalizarTreino"
      :inert="!!slotSubstituicao || store.substituindo"
      :disabled="store.finalizando || progressoTreino.concluidos < progressoTreino.total"
      class="relative z-10 mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amethyst-500 py-4 text-sm font-black text-white transition-all hover:bg-amethyst-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-40"
    >
      {{ progressoTreino.concluidos < progressoTreino.total ? `CONCLUA TODOS OS EXERCÍCIOS (${progressoTreino.concluidos}/${progressoTreino.total})` : 'FINALIZAR TREINO HOJE' }}
    </button>

    <Transition name="gy-modal" :duration="{ enter: 420, leave: 280 }"><SubstituirExercicio v-if="slotSubstituicao" :slot-id="slotSubstituicao" @fechar="slotSubstituicao = null" /></Transition>


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
