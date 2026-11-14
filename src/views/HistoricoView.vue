<script setup lang="ts">
import CalendarioHistorico from '@/components/historico/CalendarioHistorico.vue'
import { diaDaConclusao } from '@/utils/limiteDiario'
import { feedback } from '@/composables/useFeedback'
import { computed, onMounted, ref } from 'vue'
import { db, type HistoricoTreino } from '@/database/db'
import { ArrowUpRight, CalendarDays, Check, ChevronDown, Clock3, Dumbbell, History, RefreshCw } from 'lucide-vue-next'
import HistoricoDetalhe from '@/components/historico/HistoricoDetalhe.vue'
import SectionPageHeader from '@/components/layout/SectionPageHeader.vue'
import { calcularResumoHistorico, contarExercicios, contarSeriesDaSessao, dataConclusao, formatarData, formatarTempoTotal, ordenarHistorico, obterDuracaoMinutos, formatarDuracao } from '@/utils/historico'

const carregando = ref(true)
const erro = ref(false)
const sessoes = ref<HistoricoTreino[]>([])
const sessaoSelecionada = ref<HistoricoTreino | null>(null)
const limiteVisivel = ref(20)
const diaSelecionado = ref<string | null>(null)

const resumo = computed(() => calcularResumoHistorico(sessoes.value))
const sessoesOrdenadas = computed(() => ordenarHistorico(sessoes.value))
const sessoesFiltradas = computed(() => sessoesOrdenadas.value.filter(s => !diaSelecionado.value || diaDaConclusao(s) === diaSelecionado.value))
const sessoesVisiveis = computed(() => sessoesFiltradas.value.slice(0, limiteVisivel.value))

const carregarHistorico = async () => {
  carregando.value = true
  erro.value = false
  try {
    // Mantém a leitura dos registros antigos sem o índice estado, sem exigir migração.
    const registros = await db.historico.toArray()
    sessoes.value = registros.filter(registro => registro && typeof registro === 'object')
    limiteVisivel.value = 20
  } catch (error) {
    console.error('Não foi possível carregar o histórico:', error)
    erro.value = true
    feedback.error('Não foi possível carregar o histórico.')
    sessoes.value = []
  } finally {
    carregando.value = false
  }
}

onMounted(carregarHistorico)

const chaveSessao = (sessao: HistoricoTreino, index: number) => sessao.id ?? `${sessao.treinoId}-${dataConclusao(sessao)?.getTime() ?? index}`
const dataCard = (sessao: HistoricoTreino) => formatarData(dataConclusao(sessao), { dateStyle: 'medium' })
const horarioCard = (sessao: HistoricoTreino) => {
  const data = sessao.dataFim ?? sessao.dataInicio
  return data ? formatarData(data, { hour: '2-digit', minute: '2-digit' }) : null
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-10">

    <SectionPageHeader titulo="Histórico de treinos" subtitulo="Sua jornada · Cada treino conta" tema="historico" />

    <section aria-label="Resumo da atividade" class="grid grid-cols-3 gap-2 sm:gap-3">
      <article class="rounded-2xl border border-whitesmoke-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4">
        <div class="mb-2 flex items-center gap-1.5 text-amethyst-600"><Dumbbell :size="17" /><span class="text-[9px] font-bold uppercase tracking-wide sm:text-[10px]">Concluídos</span></div>
        <p class="text-xl font-bold text-whitesmoke-950 sm:text-2xl">{{ resumo.totalTreinos }}</p>
        <p class="mt-0.5 text-[10px] text-whitesmoke-500">no total</p>
      </article>
      <article class="rounded-2xl border border-whitesmoke-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4">
        <div class="mb-2 flex items-center gap-1.5 text-teal-600"><CalendarDays :size="17" /><span class="text-[9px] font-bold uppercase tracking-wide sm:text-[10px]">Frequência</span></div>
        <p class="text-xl font-bold text-whitesmoke-950 sm:text-2xl">{{ resumo.treinosUltimosSeteDias }}</p>
        <p class="mt-0.5 text-[10px] text-whitesmoke-500">últimos 7 dias</p>
      </article>
      <article class="rounded-2xl border border-whitesmoke-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4">
        <div class="mb-2 flex items-center gap-1.5 text-cerulean-600"><Clock3 :size="17" /><span class="text-[9px] font-bold uppercase tracking-wide sm:text-[10px]">Tempo total</span></div>
        <p class="text-lg font-bold text-whitesmoke-950 sm:text-2xl">{{ formatarTempoTotal(resumo.tempoTotalMinutos) }}</p>
        <p class="mt-0.5 text-[10px] text-whitesmoke-500">registrado</p>
      </article>
    </section>

    <CalendarioHistorico v-if="!carregando && !erro" :sessoes="sessoes" :selecionado="diaSelecionado" @selecionar="diaSelecionado = $event; limiteVisivel = 20" />

    <section aria-labelledby="lista-historico-titulo" class="flex flex-col gap-3">
      <div class="flex items-center justify-between px-1">
        <h2 id="lista-historico-titulo" class="text-lg font-bold text-whitesmoke-900">{{ diaSelecionado ? 'Treinos deste dia' : 'Treinos recentes' }}</h2>
        <span v-if="!carregando && !erro && sessoesOrdenadas.length" class="text-xs font-medium text-whitesmoke-500">{{ sessoesFiltradas.length }} {{ sessoesFiltradas.length === 1 ? 'treino' : 'treinos' }}</span>
      </div>

      <div v-if="carregando" class="flex flex-col items-center rounded-3xl border border-whitesmoke-200 bg-white px-5 py-12 text-center" role="status" aria-live="polite">
        <RefreshCw :size="24" class="mb-3 animate-spin text-teal-600" />
        <p class="font-semibold text-whitesmoke-700">Carregando seu histórico…</p>
      </div>

      <div v-else-if="erro" class="flex flex-col items-center rounded-3xl border border-bubblegum-200 bg-white px-5 py-10 text-center" role="alert">
        <History :size="28" class="mb-3 text-bubblegum-500" />
        <h3 class="font-bold text-whitesmoke-950">Não foi possível carregar o histórico</h3>
        <p class="mt-1 max-w-sm text-sm text-whitesmoke-500">Seus treinos continuam salvos. Confira o armazenamento e tente novamente.</p>
        <button type="button" class="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700" @click="carregarHistorico">
          <RefreshCw :size="16" /> Tentar novamente
        </button>
      </div>

      <div v-else-if="sessoesOrdenadas.length === 0" class="flex flex-col items-center rounded-3xl border border-whitesmoke-200 bg-white px-5 py-10 text-center sm:py-12">
        <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600"><Dumbbell :size="27" /></div>
        <h3 class="text-lg font-bold text-whitesmoke-950">Seu histórico começa com o primeiro treino!</h3>
        <p class="mt-1 max-w-sm text-sm text-whitesmoke-500">Quando você concluir uma sessão, ela aparecerá aqui com tudo o que registrou.</p>
        <RouterLink to="/" class="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amethyst-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-amethyst-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amethyst-600">
          Ir para treino <ArrowUpRight :size="17" />
        </RouterLink>
      </div>

      <p v-else-if="!sessoesFiltradas.length" class="rounded-2xl bg-white p-6 text-center text-sm text-whitesmoke-500">Nenhum treino concluído nesta data. Limpe o filtro para ver todos.</p>
      <template v-else>
        <button
          v-for="(sessao, index) in sessoesVisiveis"
          :key="chaveSessao(sessao, index)"
          type="button"
          class="group w-full rounded-3xl border border-whitesmoke-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:p-5"
          :aria-label="`Ver detalhes de ${sessao.treinoNome || 'treino salvo'} da ficha ${sessao.fichaNome || 'removida'}, ${dataCard(sessao)}`"
          @click="sessaoSelecionada = sessao"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 transition group-hover:bg-teal-100"><Check :size="21" /></div>
              <div class="min-w-0">
                <h3 class="break-words font-bold text-whitesmoke-950">{{ sessao.treinoNome || 'Treino salvo' }}</h3>
                <p class="mt-0.5 truncate text-xs text-whitesmoke-500">{{ sessao.fichaNome || 'Ficha removida' }}<span v-if="sessao.fichaFoco"> · {{ sessao.fichaFoco }}</span></p>
                <p class="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-whitesmoke-600">
                  <span>{{ dataCard(sessao) }}</span>
                  <span v-if="horarioCard(sessao)" aria-hidden="true">·</span>
                  <span v-if="horarioCard(sessao)">{{ horarioCard(sessao) }}</span>
                </p>
              </div>
            </div>
            <ChevronDown :size="18" class="mt-1 shrink-0 -rotate-90 text-whitesmoke-400 transition group-hover:translate-x-0.5 group-hover:text-teal-600" />
          </div>
          <div class="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-whitesmoke-100 pt-3 text-xs font-medium text-whitesmoke-600">
            <span class="inline-flex items-center gap-1.5"><Clock3 :size="14" class="text-amethyst-500" />{{ formatarDuracao(obterDuracaoMinutos(sessao)) }}</span>
            <span class="inline-flex items-center gap-1.5"><Dumbbell :size="14" class="text-cerulean-600" />{{ contarExercicios(sessao) }} {{ contarExercicios(sessao) === 1 ? 'exercício' : 'exercícios' }}</span>
            <span class="inline-flex items-center gap-1.5"><Check :size="14" class="text-teal-600" />{{ contarSeriesDaSessao(sessao) }} {{ contarSeriesDaSessao(sessao) === 1 ? 'série concluída' : 'séries concluídas' }}</span>
          </div>
        </button>

        <button v-if="limiteVisivel < sessoesFiltradas.length" type="button" class="mx-auto inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-teal-700 transition hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-teal-600" @click="limiteVisivel += 20">
          Carregar mais <ChevronDown :size="17" />
        </button>
      </template>
    </section>

    <Transition name="gy-modal" :duration="{ enter: 420, leave: 280 }" appear><HistoricoDetalhe v-if="sessaoSelecionada" :sessao="sessaoSelecionada" @fechar="sessaoSelecionada = null" /></Transition>
  </div>
</template>
